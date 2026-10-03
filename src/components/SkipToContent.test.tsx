import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SkipToContent } from './SkipToContent';

describe('SkipToContent', () => {
  it('renders a visually hidden link that points to main-content', () => {
    render(<SkipToContent />);

    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#main-content');

    // Check for sr-only and focus classes
    expect(link).toHaveClass('sr-only');
    expect(link).toHaveClass('focus:not-sr-only');
    expect(link).toHaveClass('focus:fixed');
  });
});
