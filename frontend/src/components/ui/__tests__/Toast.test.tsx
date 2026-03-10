import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Toast } from '@/components/ui/Toast';

describe('Toast', () => {
  it('renders error variant as alert', () => {
    render(<Toast variant="error" title="Something went wrong" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<Toast variant="success" title="Saved" onClose={onClose} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Close notification' }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
