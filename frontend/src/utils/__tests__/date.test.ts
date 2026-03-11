import { describe, expect, it, vi } from 'vitest';
import { formatRelativeTime } from '@/utils/date';

describe('formatRelativeTime', () => {
  it('returns "just now" for very recent times', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    vi.setSystemTime(now);

    const result = formatRelativeTime('2024-01-01T11:59:40Z');

    expect(result).toBe('just now');
  });

  it('returns hours ago for differences under a day', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    vi.setSystemTime(now);

    const result = formatRelativeTime('2024-01-01T10:00:00Z');

    expect(result).toBe('about 2 hours ago');
  });
});
