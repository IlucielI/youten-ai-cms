import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReportsManager } from './reports-manager';

describe('ReportsManager', () => {
  it('renders ReportsManager with abuse queue and resolution controls', () => {
    const mockReports = [
      {
        id: '55555555-5555-5555-5555-555555555555',
        recording_id: '66666666-6666-6666-6666-666666666666',
        reporter_ref: 'auditor@company.com',
        reason: 'CONFIDENTIAL_LEAK',
        details: 'Meeting contains proprietary source code credentials',
        status: 'PENDING' as const,
      },
    ];

    render(<ReportsManager initialReports={mockReports} />);

    expect(screen.getByText('Abuse & Moderation Console')).toBeDefined();
    expect(screen.getByText('#55555555')).toBeDefined();
    expect(screen.getByText('CONFIDENTIAL_LEAK')).toBeDefined();
    expect(screen.getByText('Take Action')).toBeDefined();
  });
});
