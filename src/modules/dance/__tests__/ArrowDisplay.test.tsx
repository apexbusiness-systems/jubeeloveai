import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArrowButtons } from '../ArrowDisplay';

describe('ArrowButtons', () => {
  it('renders directional buttons with aria-labels', () => {
    const onInput = vi.fn();
    render(<ArrowButtons onInput={onInput} />);

    const up = screen.getByLabelText('Move up');
    const down = screen.getByLabelText('Move down');
    const left = screen.getByLabelText('Move left');
    const right = screen.getByLabelText('Move right');

    expect(up).toHaveClass('dance-thumbpad-button');
    expect(down).toHaveClass('dance-thumbpad-button');
    expect(left).toHaveClass('dance-thumbpad-button');
    expect(right).toHaveClass('dance-thumbpad-button');

    up.focus();
    expect(up).toHaveFocus();
  });

  it('invokes onInput when tapped', () => {
    const onInput = vi.fn();
    render(<ArrowButtons onInput={onInput} />);

    fireEvent.click(screen.getByLabelText('Move left'));
    expect(onInput).toHaveBeenCalledWith('left');
  });
});
