'use client';

import React, { useState } from 'react';
import { AdminTemplateItem, AdminTestTemplateResult } from '@/server/schemas/admin.schema';
import { apiFetchData } from '@/lib/api-client';
import { toast } from 'sonner';

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
  const [formSystemPrompt, setFormSystemPrompt] = useState('');
  const [formSchemaJson, setFormSchemaJson] = useState('{\n  "title": "string",\n  "action_items": ["string"]\n}');
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sandbox State
  const [sandboxTemplate, setSandboxTemplate] = useState<AdminTemplateItem | null>(null);
  const [sandboxSampleTranscript, setSandboxSampleTranscript] = useState(
    'Alex: Hello team, today we need to decide on the database migration strategy for PostgreSQL 17.\nSarah: I tested pg_upgrade and it ran in under 4 minutes with zero data corruption.\nAlex: Perfect, let us schedule the deployment for Sunday at 02:00 UTC.'
  );
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<AdminTestTemplateResult | null>(null);

  const resetForm = () => {
    setFormDisplayName('');
    setFormCategoryKey('MOM');
    setFormSystemPrompt('');
    setFormSchemaJson('{\n  "title": "string",\n  "action_items": ["string"]\n}');
    setFormIsDefault(false);
    setIsCreateOpen(false);
    setEditingTemplate(null);
  };

  const handleOpenEdit = (t: AdminTemplateItem) => {
    setEditingTemplate(t);
    setFormDisplayName(t.display_name);
    setFormCategoryKey(t.category_key);
    setFormSystemPrompt(t.system_prompt);
    setFormSchemaJson(JSON.stringify(t.schema_definition, null, 2));
    setFormIsDefault(t.is_default);
  };

  const handleOpenSandbox = (t: AdminTemplateItem) => {
    setSandboxTemplate(t);
    setSandboxResult(null);
    setIsSandboxOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    let parsedSchema: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(formSchemaJson);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        toast.error('Schema definition must be a valid JSON object');
        return;
      }
      parsedSchema = parsed as Record<string, unknown>;
    } catch {
      toast.error('Invalid JSON in schema definition');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTemplate) {
        const updated = await apiFetchData<AdminTemplateItem>(`/api/admin/templates/${editingTemplate.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            display_name: formDisplayName,
            system_prompt: formSystemPrompt,
            schema_definition: parsedSchema,
            is_default: formIsDefault,
          }),
        });
        toast.success(`Template ${updated.display_name} updated successfully`);
        setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const created = await apiFetchData<AdminTemplateItem>('/api/admin/templates', {
          method: 'POST',
          body: JSON.stringify({
            category_key: formCategoryKey,
            display_name: formDisplayName,
            system_prompt: formSystemPrompt,
            schema_definition: parsedSchema,
            is_default: formIsDefault,
          }),
        });
        toast.success(`Template ${created.display_name} created successfully`);
        setTemplates((prev) => [...prev, created]);
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
          system_prompt: sandboxTemplate.system_prompt,
          schema_definition: sandboxTemplate.schema_definition,
          sample_transcript: sandboxSampleTranscript,
        }),
      });
      setSandboxResult(res);
      toast.success(`Simulation completed in ${res.latency_ms}ms`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Sandbox execution failed');
    } finally {
      setSandboxRunning(false);
    }
  };

  const filteredTemplates =
    selectedCategory === 'ALL'
      ? templates
      : templates.filter((t) => t.category_key.toUpperCase() === selectedCategory.toUpperCase());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Prompt Templates &amp; Sandbox</h1>
          <p className="text-xs text-slate-500 mt-1">
            Design, version-control, and live-test LLM synthesis templates for meeting minutes, 1-on-1s, and tutorials.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>➕ Create Template</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['ALL', 'MOM', 'ONE_ON_ONE', 'TUTORIAL', 'GENERAL'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat === 'ONE_ON_ONE' ? '1-on-1 Sessions' : cat === 'MOM' ? 'Minutes of Meeting (MOM)' : cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900">{template.display_name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    v{template.version}
                  </span>
                </div>
                {template.is_default && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Default
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    System Directive Prompt
                  </span>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700 max-h-20 overflow-y-auto line-clamp-3">
                    {template.system_prompt}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    JSON Schema Definition
                  </span>
                  <pre className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700 max-h-20 overflow-y-auto">
                    {JSON.stringify(template.schema_definition, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Category: {template.category_key}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenSandbox(template)}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1"
                >
                  <span>🧪 Test in Sandbox</span>
                </button>
                <button
                  onClick={() => handleOpenEdit(template)}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal Dialog */}
      {(isCreateOpen || editingTemplate) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <h3 className="text-base font-bold text-slate-900">
                {editingTemplate ? `Edit Template: ${editingTemplate.display_name}` : 'Create Prompt Template'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category Key</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTemplate}
                    placeholder="MOM"
                    value={formCategoryKey}
                    onChange={(e) => setFormCategoryKey(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  System Directive Prompt
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="You are an expert executive secretary. Synthesize structured notes..."
                  value={formSystemPrompt}
                  onChange={(e) => setFormSystemPrompt(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Schema Definition (JSON Schema)
                </label>
                <textarea
                  rows={4}
                  required
                  value={formSchemaJson}
                  onChange={(e) => setFormSchemaJson(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsDefault}
                    onChange={(e) => setFormIsDefault(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-800">Set as Default Template for Category</span>
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Template'}
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
                <h3 className="text-base font-bold text-slate-900">
                  Prompt Sandbox: {sandboxTemplate.display_name} (v{sandboxTemplate.version})
                </h3>
              </div>
              <button
                onClick={() => setIsSandboxOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sample Transcript for Testing
                </label>
                <textarea
                  rows={4}
                  value={sandboxSampleTranscript}
                  onChange={(e) => setSandboxSampleTranscript(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRunSandbox}
                  disabled={sandboxRunning}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <span>{sandboxRunning ? '⏳ Synthesizing...' : '⚡ Run Simulation'}</span>
                </button>
              </div>

              {sandboxResult && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Simulation Output</span>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                      <span>⏱️ Latency: {sandboxResult.latency_ms}ms</span>
                      {sandboxResult.token_usage?.total_tokens && (
                        <span>🎟️ Tokens: {sandboxResult.token_usage.total_tokens}</span>
                      )}
                    </div>
                  </div>

                  <pre className="p-3 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(sandboxResult.output, null, 2)}
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
