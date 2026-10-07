import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DLQManager } from './dlq-manager';

describe('DLQManager', () => {
  it('renders DLQManager with job diagnostics and replay buttons', () => {
    const mockDLQ = [
      {
        recording_id: '44444444-4444-4444-4444-444444444444',
        title: 'Q3 Financial Review Recording',
        status: 'FAILED',
        error_reason: 'Deepgram transcription timed out after 3 retries',
        retry_count: 3,
        created_at: new Date().toISOString(),
      },
    ];

    render(<DLQManager initialItems={mockDLQ} />);

    expect(screen.getByText('Pipeline Dead-Letter Queue (DLQ)')).toBeDefined();
    expect(screen.getByText('Q3 Financial Review Recording')).toBeDefined();
    expect(screen.getByText('3 Attempts')).toBeDefined();
    expect(screen.getByText('Deepgram transcription timed out after 3 retries')).toBeDefined();
  });
});
