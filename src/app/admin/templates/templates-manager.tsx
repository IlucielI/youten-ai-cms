'use client';

import React, { useMemo, useState } from 'react';
import { AdminTemplateItem, AdminTestTemplateResult } from '@/server/schemas/admin.schema';
import { apiFetchData } from '@/lib/api-client';
import { toast } from 'sonner';

export interface BlueprintPreset {
  category_key: string;
  name: string;
  description: string;
  system_prompt: string;
  schema_definition: Record<string, unknown>;
  sample_transcript: string;
}

export const BLUEPRINT_PRESETS: Record<string, BlueprintPreset> = {
  MOM: {
    category_key: 'MOM',
    name: 'Executive Board & Team MOM',
    description: 'Formal meeting minutes with attendees, executive summary, key decisions, action items with DoD, and consensus index.',
    system_prompt:
      'Analisis transkrip rapat ke dalam format Minutes of Meeting (MOM) formal tingkat eksekutif. Ekstraksi daftar hadir/absen, tujuan pertemuan, ringkasan eksekutif berbasis data, dinamika konsensus & speaker voice share, keputusan utama beserta argumen yang diperdebatkan, tabel action items akuntabel (PIC, deadline, Definition of Done), serta open issues / parking lot.',
    schema_definition: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        meeting_title: { type: 'string' },
        executive_summary: { type: 'string' },
        consensus_index: { type: 'string' },
        key_decisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              rationale: { type: 'string' },
              contested_points: { type: 'string' },
            },
            required: ['decision', 'rationale'],
          },
        },
        action_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              pic: { type: 'string' },
              due_date: { type: 'string' },
              definition_of_done: { type: 'string' },
            },
            required: ['task', 'pic', 'due_date'],
          },
        },
        parking_lot: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['meeting_title', 'executive_summary', 'key_decisions', 'action_items'],
    },
    sample_transcript:
      'Alex: Hello team, today we need to decide on the database migration strategy for PostgreSQL 17.\nSarah: I tested pg_upgrade with hardlinks and it ran in under 4 minutes with zero data corruption. However, Kevin was concerned about rollback procedure.\nKevin: If we take a physical snapshot right before cutoff, rollback takes under 2 minutes.\nAlex: Perfect, let us schedule the deployment for Sunday at 02:00 UTC. Sarah will lead the script execution, Kevin handles snapshot verification.',
  },
  '1_ON_1': {
    category_key: '1_ON_1',
    name: 'Manager & Direct Report 1-on-1 Sync',
    description: 'Bi-weekly growth sync evaluating morale, OKR progress, blockers, two-way feedback, and personal development goals.',
    system_prompt:
      'Sintesis percakapan 1-on-1 antara manajer dan direct report secara privat dan objektif. Fokus pada evaluasi sentimen/kesejahteraan mental, progres inisiatif kunci/OKR, hambatan (blockers) yang perlu diurai oleh manajer, umpan balik dua arah konstruktif, serta komitmen aksi untuk periode berikutnya.',
    schema_definition: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        sync_title: { type: 'string' },
        morale_and_energy: { type: 'string' },
        key_highlights: {
          type: 'array',
          items: { type: 'string' },
        },
        blockers_escalations: {
          type: 'array',
          items: { type: 'string' },
        },
        feedback_exchanged: {
          type: 'object',
          properties: {
            to_report: { type: 'string' },
            to_manager: { type: 'string' },
          },
        },
        action_commitments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              commitment: { type: 'string' },
              owner: { type: 'string' },
              review_date: { type: 'string' },
            },
            required: ['commitment', 'owner'],
          },
        },
      },
      required: ['sync_title', 'morale_and_energy', 'blockers_escalations', 'action_commitments'],
    },
    sample_transcript:
      'Manager: How are you feeling about the workload on the streaming pipeline?\nReport: Overall good, but I feel blocked waiting for API review from Platform team on the schemas.\nManager: Understood. I will sync with David this afternoon to unblock the PR approval.\nReport: Thanks! Also, I want to attend the distributed systems conference next month.\nManager: Approved, submit the expense request by Friday.',
  },
  INTERVIEW: {
    category_key: 'INTERVIEW',
    name: 'Candidate Evaluation Scorecard',
    description: 'Structured hiring evaluation analyzing technical competence, communication, problem solving, culture fit, and hire recommendation.',
    system_prompt:
      'Evaluasi wawancara kandidat kerja secara terstruktur berdasarkan standar Google Structured Interviewing. Rinci kelebihan teknis, kelemahan, penilaian kompetensi inti (problem solving, system design, komunikasi, culture fit), serta rekomendasi akhir hiring (Strong Hire / Hire / Lean Hire / No Hire) beserta alasannya.',
    schema_definition: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        candidate_name: { type: 'string' },
        role_applied: { type: 'string' },
        recommendation: { type: 'string', enum: ['Strong Hire', 'Hire', 'Lean Hire', 'No Hire', 'Strong No Hire'] },
        summary_verdict: { type: 'string' },
        strengths: {
          type: 'array',
          items: { type: 'string' },
        },
        areas_for_growth: {
          type: 'array',
          items: { type: 'string' },
        },
        competency_scores: {
          type: 'object',
          properties: {
            technical_depth: { type: 'string' },
            problem_solving: { type: 'string' },
            communication: { type: 'string' },
            cultural_alignment: { type: 'string' },
          },
          required: ['technical_depth', 'problem_solving', 'communication'],
        },
      },
      required: ['candidate_name', 'recommendation', 'summary_verdict', 'strengths', 'competency_scores'],
    },
    sample_transcript:
      'Interviewer: Could you explain how you handled eventual consistency in your previous inventory microservice?\nCandidate: We used transactional outbox pattern with Debezium and Kafka. When an order was placed, we committed the outbox event in the same DB transaction, then published it to Kafka with at-least-once delivery and idempotency keys on consumers.\nInterviewer: Excellent depth on idempotency deduplication.',
  },
  TECH_REVIEW: {
    category_key: 'TECH_REVIEW',
    name: 'Engineering RFC & Tech Review',
    description: 'System architecture review documenting ADR decisions, rejected alternatives, NFR impact, and tech debt considerations.',
    system_prompt:
      'Sintesis percakapan teknis arsitektur ke dalam format RFC/ADR dengan alternatif solusi yang ditolak, konsensus arsitektural, dan rencana mitigasi teknis.',
    schema_definition: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        context: { type: 'string' },
        decisions_adopted: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              technical_justification: { type: 'string' },
            },
            required: ['decision', 'technical_justification'],
          },
        },
        rejected_alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              rejection_reason: { type: 'string' },
            },
            required: ['alternative', 'rejection_reason'],
          },
        },
        nfr_assessment: {
          type: 'object',
          properties: {
            performance_scalability: { type: 'string' },
            reliability_resilience: { type: 'string' },
            security: { type: 'string' },
          },
          required: ['security', 'performance_scalability', 'reliability_resilience'],
        },
        action_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              assignee: { type: 'string' },
              target_sprint: { type: 'string' },
            },
            required: ['task', 'assignee', 'target_sprint'],
          },
        },
      },
      required: ['context', 'decisions_adopted', 'rejected_alternatives', 'nfr_assessment', 'action_items'],
    },
    sample_transcript:
      'Lead Architect: We need to choose between RabbitMQ and Apache Kafka for our real-time audit event ingestion.\nSecurity Eng: Compliance requires immutable replay for 30 days.\nStaff Eng: Kafka provides partitioned commit logs with configurable 30-day retention out-of-the-box, whereas RabbitMQ queues would bloat under 50GB payloads.\nLead Architect: Adopt Kafka for audit streams. Action item for Budi to write Terraform module.',
  },
  SALES_DISCOVERY: {
    category_key: 'SALES_DISCOVERY',
    name: 'B2B Sales Discovery & MEDDPICC',
    description: 'B2B qualification using MEDDPICC framework, client pain points, timeline, decision criteria, and agreed next steps.',
    system_prompt:
      'Analisis percakapan sales discovery menggunakan framework MEDDPICC, pain points, timeline evaluasi prospek, dan langkah konfirmasi teknis.',
    schema_definition: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        prospect_company: { type: 'string' },
        pain_points: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pain: { type: 'string' },
              cost_of_inaction: { type: 'string' },
            },
            required: ['pain', 'cost_of_inaction'],
          },
        },
        meddpicc: {
          type: 'object',
          properties: {
            metrics: { type: 'string' },
            economic_buyer: { type: 'string' },
            decision_criteria: { type: 'string' },
            champion: { type: 'string' },
            competition: { type: 'string' },
          },
          required: ['metrics', 'economic_buyer', 'decision_criteria', 'champion'],
        },
        next_steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              owner: { type: 'string' },
              target_date: { type: 'string' },
            },
            required: ['action', 'owner', 'target_date'],
          },
        },
      },
      required: ['prospect_company', 'pain_points', 'meddpicc', 'next_steps'],
    },
    sample_transcript:
      'AE: What is currently the biggest bottleneck in your media processing pipeline?\nProspect VP: We waste 15 engineer hours each week manually tagging and clipping video recordings, costing around $60k annually.\nAE: If we could automate that via API in under 5 minutes with SOC2 compliance, who else needs to approve the evaluation?\nProspect VP: Myself and our VP of Infosec. We can kick off a POC next Tuesday.',
  },
  DAILY_STANDUP: {
    category_key: 'DAILY_STANDUP',
    name: 'Daily Scrum Standup Sync',
    description: 'Daily engineering standup capturing completed work, in-flight priorities, blockers, and sprint milestone health.',
    system_prompt:
      'Ekstraksi pembaruan harian tim pengembang ke dalam ringkasan standup terstruktur: apa yang tuntas kemarin, target hari ini, serta hambatan kritis (blockers) yang memerlukan intervensi Scrum Master atau rekan tim.',
    schema_definition: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        team_name: { type: 'string' },
        sprint_goal_progress: { type: 'string' },
        member_updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              member: { type: 'string' },
              yesterday_completed: { type: 'string' },
              today_plan: { type: 'string' },
              blockers: { type: 'string' },
            },
            required: ['member', 'yesterday_completed', 'today_plan'],
          },
        },
        critical_impediments: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['team_name', 'sprint_goal_progress', 'member_updates'],
    },
    sample_transcript:
      'Scrum Master: Good morning team, let us do the round.\nRina: Yesterday I finished the JWT token revocation endpoint. Today I am hooking up Redis blacklist and writing integration tests. No blockers.\nAdi: Yesterday I worked on the webhook retry worker. Today I am stuck because staging rabbitmq cluster credentials expired.\nScrum Master: Thanks Adi, I will refresh vault secrets right after standup.',
  },
  GENERAL: {
    category_key: 'GENERAL',
    name: 'Executive Cornell Briefing',
    description: 'Structured briefing extracting high-level synthesis, key themes, critical quotes, and actionable takeaways from any conversation.',
    system_prompt:
      'Ringkas materi percakapan, diskusi, atau rekaman umum secara cerdas menggunakan format Executive Cornell Briefing. Sajikan rangkuman inti, tema-tema krusial yang dibahas, kutipan kunci pembicara, serta rekomendasi tindak lanjut yang dapat dieksekusi.',
    schema_definition: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        topic_title: { type: 'string' },
        executive_briefing: { type: 'string' },
        key_themes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theme: { type: 'string' },
              summary: { type: 'string' },
            },
            required: ['theme', 'summary'],
          },
        },
        actionable_takeaways: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['topic_title', 'executive_briefing', 'key_themes', 'actionable_takeaways'],
    },
    sample_transcript:
      'Host: Welcome to the AI Engineering panel. Let us discuss how enterprise teams evaluate LLM latency versus accuracy.\nPanelist 1: Smaller domain-finetuned models with strict JSON schema constraints consistently beat massive generic models in speed and cost by 80%.\nPanelist 2: Agreed, prompt grounding and rigid schema validation are mandatory for production pipelines.',
  },
  PODCAST: {
    category_key: 'PODCAST',
    name: 'Podcast & Talkshow Show Notes',
    description: 'Detailed show notes, guest bios, key takeaways, golden quotes, and timestamped chapters from talkshows and podcasts.',
    system_prompt:
      'Analisis transkrip percakapan podcast atau talkshow berikut ke dalam format show notes terstruktur. Ekstraksi judul episode, profil tamu, ringkasan episode, pembahasan per babak topik (chapters) dengan perkiraan rentang timestamp, poin penting (key takeaways), kutipan berkesan (golden quotes), serta rekomendasi buku, artikel, atau tautan yang disebutkan.',
    schema_definition: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        episode_title: { type: 'string' },
        show_notes: { type: 'string' },
        guest_overview: {
          type: 'object',
          properties: {
            guest_name: { type: 'string' },
            guest_title: { type: 'string' },
            bio_or_background: { type: 'string' },
          },
        },
        topic_chapters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              topic: { type: 'string' },
              summary: { type: 'string' },
            },
            required: ['timestamp', 'topic', 'summary'],
          },
        },
        key_takeaways: {
          type: 'array',
          items: { type: 'string' },
        },
        golden_quotes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              speaker: { type: 'string' },
              quote: { type: 'string' },
              context: { type: 'string' },
            },
            required: ['quote', 'speaker'],
          },
        },
      },
      required: ['episode_title', 'show_notes', 'guest_overview', 'topic_chapters', 'key_takeaways', 'golden_quotes'],
    },
    sample_transcript:
      'Host: Welcome back to TechUnplugged! Today we have Maria, Principal AI Scientist at OpenCorp.\nMaria: Thanks for having me! In 2026, the biggest leap is not model size, but verifiable structured generation.\nHost: How does that impact developer tooling?\nMaria: It eliminates post-processing parser errors completely.',
  },
};

export const CATEGORY_TABS = [
  { key: 'ALL', label: 'All Templates' },
  { key: 'MOM', label: 'Minutes of Meeting (MOM)' },
  { key: '1_ON_1', label: '1-on-1 Sync' },
  { key: 'INTERVIEW', label: 'Interview Scorecard' },
  { key: 'TECH_REVIEW', label: 'Architecture & RFC' },
  { key: 'SALES_DISCOVERY', label: 'Sales Discovery' },
  { key: 'DAILY_STANDUP', label: 'Daily Standup' },
  { key: 'GENERAL', label: 'Executive Brief' },
  { key: 'PODCAST', label: 'Podcast' },
  { key: 'MUSIC_LYRICS', label: 'Music & Stem' },
] as const;

export function validateDraft07Schema(schemaStr: string): { isValid: boolean; error?: string } {
  try {
    const parsed = JSON.parse(schemaStr);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { isValid: false, error: 'Schema must be a valid JSON object' };
    }
    if (parsed.type !== 'object') {
      return { isValid: false, error: "Root schema 'type' must be 'object'" };
    }
    if (
      !parsed.properties ||
      typeof parsed.properties !== 'object' ||
      Array.isArray(parsed.properties) ||
      Object.keys(parsed.properties).length === 0
    ) {
      return { isValid: false, error: "'properties' must be a non-empty object" };
    }
    return { isValid: true };
  } catch (err) {
    return { isValid: false, error: err instanceof Error ? err.message : 'Invalid JSON format' };
  }
}

interface TemplatesManagerProps {
  initialTemplates: AdminTemplateItem[];
}

export function TemplatesManager({ initialTemplates }: TemplatesManagerProps) {
  const [templates, setTemplates] = useState<AdminTemplateItem[]>(initialTemplates);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AdminTemplateItem | null>(null);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);

  // Form State
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formCategoryKey, setFormCategoryKey] = useState('MOM');
  const [formDescription, setFormDescription] = useState('');
  const [formSystemPrompt, setFormSystemPrompt] = useState('');
  const [formSchemaJson, setFormSchemaJson] = useState(
    JSON.stringify(BLUEPRINT_PRESETS.MOM.schema_definition, null, 2)
  );
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sandbox State
  const [sandboxTemplate, setSandboxTemplate] = useState<AdminTemplateItem | null>(null);
  const [sandboxSampleTranscript, setSandboxSampleTranscript] = useState(BLUEPRINT_PRESETS.MOM.sample_transcript);
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<AdminTestTemplateResult | null>(null);

  const schemaValidation = useMemo(() => validateDraft07Schema(formSchemaJson), [formSchemaJson]);

  const resetForm = () => {
    setFormDisplayName('');
    setFormCategoryKey('MOM');
    setFormDescription('');
    setFormSystemPrompt('');
    setFormSchemaJson(JSON.stringify(BLUEPRINT_PRESETS.MOM.schema_definition, null, 2));
    setFormIsDefault(false);
    setFormIsActive(true);
    setIsCreateOpen(false);
    setEditingTemplate(null);
  };

  const applyBlueprintPreset = (presetKey: string) => {
    const preset = BLUEPRINT_PRESETS[presetKey];
    if (!preset) return;
    setFormCategoryKey(preset.category_key);
    setFormDisplayName(preset.name);
    setFormDescription(preset.description);
    setFormSystemPrompt(preset.system_prompt);
    setFormSchemaJson(JSON.stringify(preset.schema_definition, null, 2));
    toast.info(`Applied blueprint preset: ${preset.name}`);
  };

  const handleOpenEdit = (t: AdminTemplateItem) => {
    setEditingTemplate(t);
    setFormDisplayName(t.display_name || t.name || '');
    setFormCategoryKey(t.category_key);
    setFormDescription(t.description || '');
    setFormSystemPrompt(t.system_prompt || t.prompt || '');
    const schemaObj = t.schema_definition || t.output_schema || BLUEPRINT_PRESETS.MOM.schema_definition;
    setFormSchemaJson(JSON.stringify(schemaObj, null, 2));
    setFormIsDefault(Boolean(t.is_default));
    setFormIsActive(t.is_active ?? true);
    setIsCreateOpen(true);
  };

  const handleOpenSandbox = (t: AdminTemplateItem) => {
    setSandboxTemplate(t);
    setSandboxResult(null);
    const preset = BLUEPRINT_PRESETS[t.category_key];
    setSandboxSampleTranscript(preset?.sample_transcript || BLUEPRINT_PRESETS.MOM.sample_transcript);
    setIsSandboxOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateDraft07Schema(formSchemaJson);
    if (!validation.isValid) {
      toast.error(`Schema Validation Error: ${validation.error}`);
      return;
    }

    const parsedSchema = JSON.parse(formSchemaJson) as Record<string, unknown>;

    setIsSubmitting(true);
    try {
      if (editingTemplate) {
        const updated = await apiFetchData<AdminTemplateItem>(`/api/admin/templates/${editingTemplate.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: formDisplayName,
            display_name: formDisplayName,
            description: formDescription,
            prompt: formSystemPrompt,
            system_prompt: formSystemPrompt,
            output_schema: parsedSchema,
            schema_definition: parsedSchema,
            is_default: formIsDefault,
            is_active: formIsActive,
          }),
        });
        toast.success(`Template ${updated.display_name || updated.name} updated successfully`);
        setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const created = await apiFetchData<AdminTemplateItem>('/api/admin/templates', {
          method: 'POST',
          body: JSON.stringify({
            category_key: formCategoryKey,
            name: formDisplayName,
            display_name: formDisplayName,
            description: formDescription,
            prompt: formSystemPrompt,
            system_prompt: formSystemPrompt,
            output_schema: parsedSchema,
            schema_definition: parsedSchema,
            is_default: formIsDefault,
            is_active: formIsActive,
          }),
        });
        toast.success(`Template ${created.display_name || created.name} created successfully`);
        setTemplates((prev) => [created, ...prev]);
      }
      resetForm();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunSandbox = async () => {
    if (!sandboxTemplate) return;
    setSandboxRunning(true);
    try {
      const res = await apiFetchData<AdminTestTemplateResult>('/api/admin/templates/test', {
        method: 'POST',
        body: JSON.stringify({
          prompt: sandboxTemplate.system_prompt || sandboxTemplate.prompt,
          system_prompt: sandboxTemplate.system_prompt || sandboxTemplate.prompt,
          output_schema: sandboxTemplate.schema_definition || sandboxTemplate.output_schema,
          schema_definition: sandboxTemplate.schema_definition || sandboxTemplate.output_schema,
          sample_transcript: sandboxSampleTranscript,
        }),
      });
      setSandboxResult(res);
      toast.success(`Simulation completed in ${res.latency_ms ?? res.execution_time_ms ?? 0}ms`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Sandbox execution failed');
    } finally {
      setSandboxRunning(false);
    }
  };

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'ALL') return templates;
    return templates.filter((t) => t.category_key.toUpperCase() === selectedCategory.toUpperCase());
  }, [templates, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Prompt Templates &amp; Sandbox</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              {templates.length} Templates
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Design, version-control, and live-test LLM synthesis templates for meeting minutes, 1-on-1 growth syncs,
            interviews, and technical RFCs with strict Draft-07 JSON schema enforcement.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span>➕ Create Template</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {CATEGORY_TABS.map((tab) => {
          const count =
            tab.key === 'ALL'
              ? templates.length
              : templates.filter((t) => t.category_key.toUpperCase() === tab.key.toUpperCase()).length;
          const isSelected = selectedCategory === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedCategory(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="text-3xl mb-2">📋</div>
          <h3 className="text-sm font-bold text-slate-800">No prompt templates found in this category</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Get started by creating a new template using our pre-built industry blueprint presets.
          </p>
          <button
            onClick={() => {
              resetForm();
              if (selectedCategory !== 'ALL' && BLUEPRINT_PRESETS[selectedCategory]) {
                applyBlueprintPreset(selectedCategory);
              }
              setIsCreateOpen(true);
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Create {selectedCategory !== 'ALL' ? selectedCategory : ''} Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTemplates.map((template) => {
            const propsCount = template.schema_definition?.properties
              ? Object.keys(template.schema_definition.properties as Record<string, unknown>).length
              : template.output_schema?.properties
              ? Object.keys(template.output_schema.properties as Record<string, unknown>).length
              : 0;

            return (
              <div
                key={template.id}
                className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-900">
                          {template.display_name || template.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          v{template.version}
                        </span>
                      </div>
                      {template.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {template.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {template.is_default && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Default
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          template.is_active !== false
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {template.is_active !== false ? 'Active' : 'Draft'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 my-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        System Directive Prompt
                      </span>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700 max-h-20 overflow-y-auto line-clamp-3">
                        {template.system_prompt || template.prompt}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Draft-07 Output Schema
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {propsCount} {propsCount === 1 ? 'property' : 'properties'} defined
                        </span>
                      </div>
                      <pre className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700 max-h-24 overflow-y-auto">
                        {JSON.stringify(template.schema_definition || template.output_schema, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100">
                    {template.category_key}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenSandbox(template)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>🧪 Test in Sandbox</span>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(template)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingTemplate
                    ? `Edit Template: ${editingTemplate.display_name || editingTemplate.name}`
                    : 'Create Prompt Template Studio'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Configure AI system prompt and Draft-07 output schema constraints.
                </p>
              </div>
              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Blueprint Presets Bar (Only for Create) */}
            {!editingTemplate && (
              <div className="mb-4 p-3 bg-blue-50/60 rounded-xl border border-blue-100 shrink-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 block mb-1.5">
                  ⚡ Pre-built Blueprint Presets (1-Click Fill)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(BLUEPRINT_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyBlueprintPreset(key)}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-white border border-blue-200 text-blue-800 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-2xs"
                    >
                      {preset.name.split(' ')[0]} ({key})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveTemplate} className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Display Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Executive MOM Generator"
                    value={formDisplayName}
                    onChange={(e) => setFormDisplayName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Key <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTemplate}
                    placeholder="MOM | 1_ON_1 | INTERVIEW | GENERAL"
                    value={formCategoryKey}
                    onChange={(e) => setFormCategoryKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                    className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Purpose of this prompt template..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  System Directive Prompt <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="You are an expert executive analyst. Synthesize structured notes..."
                  value={formSystemPrompt}
                  onChange={(e) => setFormSystemPrompt(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Draft-07 Output Schema (JSON) <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      schemaValidation.isValid
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {schemaValidation.isValid ? '✓ Valid Object Schema' : `⚠ ${schemaValidation.error}`}
                  </span>
                </div>
                <textarea
                  rows={6}
                  required
                  value={formSchemaJson}
                  onChange={(e) => setFormSchemaJson(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Must include <code className="font-mono text-slate-600">&quot;type&quot;: &quot;object&quot;</code> and
                  non-empty <code className="font-mono text-slate-600">&quot;properties&quot;</code>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsDefault}
                    onChange={(e) => setFormIsDefault(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Set as Default Template for {formCategoryKey}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800">Active Status</span>
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !schemaValidation.isValid}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sandbox Test Modal Dialog */}
      {isSandboxOpen && sandboxTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧪</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Prompt Sandbox: {sandboxTemplate.display_name || sandboxTemplate.name} (v
                    {sandboxTemplate.version})
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    Category: {sandboxTemplate.category_key}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsSandboxOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Sample Transcript for Testing</label>
                  {BLUEPRINT_PRESETS[sandboxTemplate.category_key] && (
                    <button
                      type="button"
                      onClick={() =>
                        setSandboxSampleTranscript(BLUEPRINT_PRESETS[sandboxTemplate.category_key].sample_transcript)
                      }
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      ↻ Reset to Standard Category Sample
                    </button>
                  )}
                </div>
                <textarea
                  rows={5}
                  value={sandboxSampleTranscript}
                  onChange={(e) => setSandboxSampleTranscript(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRunSandbox}
                  disabled={sandboxRunning}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{sandboxRunning ? '⏳ Synthesizing with LLM...' : '⚡ Run Simulation'}</span>
                </button>
              </div>

              {sandboxResult && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>✨</span> Simulation Structured Output
                    </span>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                      <span>⏱️ Latency: {sandboxResult.latency_ms ?? sandboxResult.execution_time_ms ?? 0}ms</span>
                      {sandboxResult.token_usage?.total_tokens && (
                        <span>🎟️ Tokens: {sandboxResult.token_usage.total_tokens}</span>
                      )}
                    </div>
                  </div>

                  <pre className="p-3 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap overflow-x-auto max-h-72">
                    {JSON.stringify(sandboxResult.output || sandboxResult.parsed_json, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
