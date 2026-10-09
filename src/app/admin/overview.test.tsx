import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AdminOverviewPage from './page';

describe('AdminOverviewPage', () => {
  it('renders executive telemetry and metrics cards correctly', async () => {
    const Component = await AdminOverviewPage();
    render(Component);

    expect(screen.getByText('Executive Telemetry & Ops Oversight')).toBeDefined();
    expect(screen.getByText('Platform Command Center')).toBeDefined();
    expect(screen.getByText('Total Users')).toBeDefined();
    expect(screen.getByText('Audio Processed')).toBeDefined();
    expect(screen.getByText('Storage Volume')).toBeDefined();
    expect(screen.getByText('Pipeline Quality')).toBeDefined();
    expect(screen.getByText(/AI Operations & Cloud Burn Rate Oversight/)).toBeDefined();
    expect(screen.getByText('Meeting Voice Bot')).toBeDefined();
    expect(screen.getByText('Meet • Zoom • Teams • Discord')).toBeDefined();
  });
});
