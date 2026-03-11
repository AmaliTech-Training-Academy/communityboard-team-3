export function formatRelativeTime(isoString: string): string {
  const created = new Date(isoString);
  if (Number.isNaN(created.getTime())) {
    return isoString;
  }

  const now = new Date();
  const diffMs = now.getTime() - created.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return 'just now';
  }

  if (diffMs < hour) {
    const minutes = Math.round(diffMs / minute);
    return `about ${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  if (diffMs < day) {
    const hours = Math.round(diffMs / hour);
    return `about ${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  if (diffMs < 7 * day) {
    const days = Math.round(diffMs / day);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  return created.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
