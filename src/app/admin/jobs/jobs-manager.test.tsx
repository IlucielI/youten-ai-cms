import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JobsManager } from './jobs-manager';
import { AdminJobItem } from '@/server/schemas/admin.schema';

describe('JobsManager', () => {
  const mockJobs: AdminJobItem[] = [
    {
      id: 'd1000000-0000-0000-0000-000000000001',
      title: 'Annual Strategic Planning Meeting',
      original_filename: 'annual_strategy_2026.mp3',
      file_size_bytes: 48512400,
      duration_seconds: 3620,
      source_type: 'UPLOAD',
      status: 'COMPLETED',
      selected_template: 'GENERAL',
      detected_language: 'id',
      output_language: 'id',
      is_guest: false,
      user_name: 'Alex Rivera',
      user_email: 'alex.rivera@acme.corp',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'd1000000-0000-0000-0000-000000000004',
      title: 'Corrupted Audio Stream Recording',
      original_filename: 'broken_stream_session.aac',
      file_size_bytes: 1048576,
      duration_seconds: 45,
      source_type: 'UPLOAD',
      status: 'FAILED',
      selected_template: 'GENERAL',
      detected_language: null,
      output_language: 'id',
      error_code: 'CORRUPTED_STREAM',
      error_message: 'FFmpeg audio stream demuxing failed at offset 0x004a',
      is_guest: false,
      user_name: 'Marcus Vance',
      user_email: 'marcus.vance@solaris.ai',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  it('renders JobsManager with metric summaries and jobs table', () => {
    render(<JobsManager initialJobs={mockJobs} initialTotal={2} />);

    expect(screen.getByText('AI Pipeline & Generations Console')).toBeDefined();
    expect(screen.getByText('Total Jobs: 2')).toBeDefined();
    expect(screen.getByText('Annual Strategic Planning Meeting')).toBeDefined();
    expect(screen.getByText('Corrupted Audio Stream Recording')).toBeDefined();
    expect(screen.getAllByText('COMPLETED').length).toBeGreaterThan(0);
    expect(screen.getAllByText('FAILED').length).toBeGreaterThan(0);
  });

  it('opens inspector modal when clicking Inspect button', () => {
    render(<JobsManager initialJobs={mockJobs} initialTotal={2} />);

    const inspectButtons = screen.getAllByText('Inspect');
    fireEvent.click(inspectButtons[0]);

    expect(screen.getByText('Pipeline Job Details')).toBeDefined();
    expect(screen.getByText('d1000000-0000-0000-0000-000000000001')).toBeDefined();
    expect(screen.getAllByText('annual_strategy_2026.mp3').length).toBeGreaterThanOrEqual(1);

    // Close modal
    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);
    expect(screen.queryByText('Pipeline Job Details')).toBeNull();
  });

  it('correctly normalizes near-minute durations like 59.6s to 1m 0s', () => {
    const edgeJob: AdminJobItem = {
      id: 'd1000000-0000-0000-0000-000000000099',
      title: 'Near Minute Boundary Audio',
      original_filename: 'boundary.mp3',
      file_size_bytes: 1000000,
      duration_seconds: 59.6,
      source_type: 'UPLOAD',
      status: 'COMPLETED',
      selected_template: 'GENERAL',
      output_language: 'id',
      is_guest: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    render(<JobsManager initialJobs={[edgeJob]} initialTotal={1} />);
    expect(screen.getByText('1m 0s')).toBeDefined();
  });
});
