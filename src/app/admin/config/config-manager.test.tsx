import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigManager } from './config-manager';
import * as apiClient from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiFetchData: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ConfigManager', () => {
  const mockConfig = {
    is_maintenance_mode: false,
    maintenance_message: 'We are performing scheduled maintenance.',
    feature_flags: {
      enable_whisper_fallback: true,
      enable_live_streaming: false,
      enable_public_registration: true,
      enable_debug_logging: false,
    },
    updated_at: '2026-10-07T12:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial configuration and toggle labels', () => {
    render(<ConfigManager initialConfig={mockConfig} />);
    expect(screen.getByText('System Configuration & Feature Flags')).toBeDefined();
    expect(screen.getByText('Emergency Maintenance Mode')).toBeDefined();
    expect(screen.getByText('Whisper Local STT Fallback')).toBeDefined();
    expect(screen.getByText('Real-Time Audio Streaming (WS)')).toBeDefined();
    expect(screen.getByText('Public Self-Registration')).toBeDefined();
    expect(screen.getByText('Verbose Telemetry & Tracing')).toBeDefined();
  });

  it('updates configuration via PATCH when form is submitted', async () => {
    vi.mocked(apiClient.apiFetchData).mockResolvedValueOnce({
      ...mockConfig,
      is_maintenance_mode: true,
    });

    render(<ConfigManager initialConfig={mockConfig} />);
    const submitBtn = screen.getByRole('button', { name: /save configuration/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.apiFetchData).toHaveBeenCalledWith(
        '/api/admin/config',
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });
  });
});
