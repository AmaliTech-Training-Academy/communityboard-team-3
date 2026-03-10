import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TextField } from '@/components/ui/TextField';

describe('TextField', () => {
  it('associates label with input', () => {
    render(<TextField label="Email" placeholder="you@example.com" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders error state accessibly', () => {
    render(<TextField label="Email" error="Required" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-describedby');
  });

  it('calls right icon click handler', async () => {
    const onRightIconClick = vi.fn();
    render(
      <TextField
        label="Password"
        rightIcon={<span>icon</span>}
        rightIconAriaLabel="Toggle password"
        onRightIconClick={onRightIconClick}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Toggle password' }),
    );
    expect(onRightIconClick).toHaveBeenCalledTimes(1);
  });
});
