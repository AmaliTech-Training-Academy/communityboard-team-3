import type { ChipVariant } from '@/components/ui/Chip';

export function getCategoryDisplayName(
  categoryName: string | null | undefined,
): string {
  if (!categoryName) {
    return 'Uncategorized';
  }

  const normalized = categoryName.trim().toUpperCase();

  switch (normalized) {
    case 'NEWS':
      return 'News';
    case 'EVENT':
      return 'Events';
    case 'DISCUSSION':
      return 'Discussion';
    case 'ALERT':
      return 'Alert';
    default:
      return categoryName;
  }
}

export function getChipVariantForCategory(
  categoryName: string | null | undefined,
): ChipVariant {
  if (!categoryName) {
    return 'default';
  }

  const normalized = categoryName.trim().toUpperCase();

  switch (normalized) {
    case 'EVENT':
    case 'EVENTS':
      // Events → purple
      return 'event';
    case 'ALERT':
    case 'ALERTS':
      // Alert → red
      return 'lostFound';
    case 'DISCUSSION':
      // Discussion → green
      return 'recommendation';
    case 'NEWS':
      // News → brownish/yellow
      return 'helpRequest';
    default:
      return 'default';
  }
}
