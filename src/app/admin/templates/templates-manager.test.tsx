import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TemplatesManager } from './templates-manager';

describe('TemplatesManager', () => {
  it('renders TemplatesManager with categories and prompt cards', () => {
    const mockTemplates = [
      {
        id: '33333333-3333-3333-3333-333333333333',
        category_key: 'MOM',
        display_name: 'Executive Board Meeting MOM',
        system_prompt: 'Generate formal meeting minutes with action items and owners.',
        schema_definition: { title: 'string', decisions: ['string'] },
        version: 1,
        is_default: true,
      },
    ];

    render(<TemplatesManager initialTemplates={mockTemplates} />);

    expect(screen.getByText('AI Prompt Templates & Sandbox')).toBeDefined();
    expect(screen.getByText('Executive Board Meeting MOM')).toBeDefined();
    expect(screen.getByText('v1')).toBeDefined();
    expect(screen.getByText('Default')).toBeDefined();
  });
});
