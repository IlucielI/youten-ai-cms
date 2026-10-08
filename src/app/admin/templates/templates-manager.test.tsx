import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TemplatesManager, validateDraft07Schema, BLUEPRINT_PRESETS } from './templates-manager';
import * as apiClient from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiFetchData: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('TemplatesManager', () => {
  const mockTemplates = [
    {
      id: '33333333-3333-3333-3333-333333333333',
      category_key: 'MOM',
      name: 'Executive Board Meeting MOM',
      display_name: 'Executive Board Meeting MOM',
      description: 'Formal meeting minutes and action items.',
      system_prompt: 'Generate formal meeting minutes with action items and owners.',
      schema_definition: {
        type: 'object',
        properties: {
          meeting_title: { type: 'string' },
          decisions: { type: 'array', items: { type: 'string' } },
        },
      },
      version: 1,
      is_default: true,
      is_active: true,
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      category_key: '1_ON_1',
      name: 'Manager Growth Sync',
      display_name: 'Manager Growth Sync',
      description: 'Bi-weekly growth sync evaluating morale.',
      system_prompt: 'Synthesize 1-on-1 sync with feedback and commitments.',
      schema_definition: {
        type: 'object',
        properties: {
          sync_title: { type: 'string' },
          morale: { type: 'string' },
        },
      },
      version: 2,
      is_default: false,
      is_active: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders TemplatesManager with categories, badges, and template cards', () => {
    render(<TemplatesManager initialTemplates={mockTemplates} />);

    expect(screen.getByText('AI Prompt Templates & Sandbox')).toBeDefined();
    expect(screen.getByText('2 Templates')).toBeDefined();
    expect(screen.getByText('Executive Board Meeting MOM')).toBeDefined();
    expect(screen.getByText('Manager Growth Sync')).toBeDefined();
    expect(screen.getByText('v1')).toBeDefined();
    expect(screen.getByText('v2')).toBeDefined();
    expect(screen.getByText('Default')).toBeDefined();
  });

  it('filters templates when a category pill is selected', () => {
    render(<TemplatesManager initialTemplates={mockTemplates} />);

    // Click 1-on-1 Sync filter button
    const oneOnOneBtn = screen.getByRole('button', { name: /1-on-1 Sync/i });
    fireEvent.click(oneOnOneBtn);

    expect(screen.getByText('Manager Growth Sync')).toBeDefined();
    expect(screen.queryByText('Executive Board Meeting MOM')).toBeNull();

    // Click Minutes of Meeting filter button
    const momBtn = screen.getByRole('button', { name: /Minutes of Meeting/i });
    fireEvent.click(momBtn);

    expect(screen.getByText('Executive Board Meeting MOM')).toBeDefined();
    expect(screen.queryByText('Manager Growth Sync')).toBeNull();
  });

  it('validates Draft-07 JSON schema correctly', () => {
    // Valid object schema
    const valid = validateDraft07Schema(
      JSON.stringify({
        type: 'object',
        properties: {
          test: { type: 'string' },
        },
      })
    );
    expect(valid.isValid).toBe(true);

    // Missing type 'object'
    const invalidType = validateDraft07Schema(
      JSON.stringify({
        type: 'array',
        items: { type: 'string' },
      })
    );
    expect(invalidType.isValid).toBe(false);
    expect(invalidType.error).toContain("Root schema 'type' must be 'object'");

    // Empty properties
    const emptyProps = validateDraft07Schema(
      JSON.stringify({
        type: 'object',
        properties: {},
      })
    );
    expect(emptyProps.isValid).toBe(false);
    expect(emptyProps.error).toContain("'properties' must be a non-empty object");

    // Invalid JSON
    const brokenJson = validateDraft07Schema('{ broken json ');
    expect(brokenJson.isValid).toBe(false);
  });

  it('opens Create Modal and pre-populates fields using blueprint preset', async () => {
    render(<TemplatesManager initialTemplates={mockTemplates} />);

    const createBtn = screen.getByRole('button', { name: /Create Template/i });
    fireEvent.click(createBtn);

    expect(screen.getByText('Create Prompt Template Studio')).toBeDefined();

    // Click Tech Review blueprint preset button
    const techReviewPresetBtn = screen.getByRole('button', { name: /Engineering \(TECH_REVIEW\)/i });
    fireEvent.click(techReviewPresetBtn);

    // Verify fields populated
    const nameInput = screen.getByPlaceholderText('e.g. Executive MOM Generator') as HTMLInputElement;
    expect(nameInput.value).toBe(BLUEPRINT_PRESETS.TECH_REVIEW.name);

    const categoryInput = screen.getByPlaceholderText(/MOM \| 1_ON_1/i) as HTMLInputElement;
    expect(categoryInput.value).toBe('TECH_REVIEW');
  });

  it('creates a new prompt template successfully via API', async () => {
    const newTemplate = {
      id: '55555555-5555-5555-5555-555555555555',
      category_key: 'INTERVIEW',
      name: 'Candidate Evaluation Scorecard',
      display_name: 'Candidate Evaluation Scorecard',
      description: 'Structured hiring evaluation.',
      system_prompt: 'Evaluate candidate responses.',
      schema_definition: {
        type: 'object',
        properties: { recommendation: { type: 'string' } },
      },
      version: 1,
      is_default: false,
      is_active: true,
    };

    vi.mocked(apiClient.apiFetchData).mockResolvedValueOnce(newTemplate);

    render(<TemplatesManager initialTemplates={mockTemplates} />);

    // Open create modal
    fireEvent.click(screen.getByRole('button', { name: /Create Template/i }));

    // Apply interview preset
    fireEvent.click(screen.getByRole('button', { name: /Candidate \(INTERVIEW\)/i }));

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /^Create Template$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.apiFetchData).toHaveBeenCalledWith(
        '/api/admin/templates',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    // Verify added to list
    expect(await screen.findByText('Candidate Evaluation Scorecard')).toBeDefined();
  });

  it('opens Sandbox test modal, runs simulation, and displays result', async () => {
    const mockSimulationResult = {
      latency_ms: 450,
      token_usage: {
        prompt_tokens: 210,
        completion_tokens: 95,
        total_tokens: 305,
      },
      output: {
        meeting_title: 'PostgreSQL 17 Migration Strategy',
        executive_summary: 'Approved pg_upgrade with snapshot fallback.',
      },
    };

    vi.mocked(apiClient.apiFetchData).mockResolvedValueOnce(mockSimulationResult);

    render(<TemplatesManager initialTemplates={mockTemplates} />);

    // Find and click test button on first card
    const testButtons = screen.getAllByRole('button', { name: /Test in Sandbox/i });
    fireEvent.click(testButtons[0]);

    expect(screen.getByText(/Prompt Sandbox: Executive Board Meeting MOM/i)).toBeDefined();

    // Click Run Simulation
    const runBtn = screen.getByRole('button', { name: /Run Simulation/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(apiClient.apiFetchData).toHaveBeenCalledWith(
        '/api/admin/templates/test',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    // Check simulation metrics and output display
    expect(await screen.findByText(/Latency: 450ms/i)).toBeDefined();
    expect(screen.getByText(/Tokens: 305/i)).toBeDefined();
    expect(screen.getByText(/PostgreSQL 17 Migration Strategy/i)).toBeDefined();
  });
});
