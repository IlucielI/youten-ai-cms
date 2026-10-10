import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { YoutenLogo } from './youten-logo';

describe('YoutenLogo Component in CMS', () => {
  it('renders SVG logo mark with default dimensions', () => {
    render(<YoutenLogo />);
    const logoMark = screen.getByTestId('youten-logo-mark');
    expect(logoMark).toBeDefined();
    expect(logoMark.getAttribute('viewBox')).toBe('0 0 29 28');
  });

  it('renders custom sizes correctly', () => {
    const { rerender } = render(<YoutenLogo size="sm" />);
    let logoMark = screen.getByTestId('youten-logo-mark');
    expect(logoMark.getAttribute('width')).toBe('22');

    rerender(<YoutenLogo size="lg" />);
    logoMark = screen.getByTestId('youten-logo-mark');
    expect(logoMark.getAttribute('width')).toBe('36');

    rerender(<YoutenLogo size={40} />);
    logoMark = screen.getByTestId('youten-logo-mark');
    expect(logoMark.getAttribute('width')).toBe('40');
  });

  it('renders brand text when showText is true', () => {
    render(<YoutenLogo showText />);
    expect(screen.getByTestId('youten-logo-mark')).toBeDefined();
    expect(screen.getByTestId('youten-logo-text').textContent).toBe('Youten AI CMS');
  });
});
