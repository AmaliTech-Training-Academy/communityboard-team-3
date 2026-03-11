import type { ChipVariant } from '@/components/ui/Chip';
import type { PostCategory } from '@/types/post';

export function getCategoryDisplayName(
  categoryName: string | null | undefined,
): string {
  if (!categoryName) {
    return 'Uncategorized';
  }

  const normalized = categoryName.trim().toUpperCase() as PostCategory | string;

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

/**
 * Maps backend category names to visual chip variants.
 *
 * Backend categories:
 * - NEWS
 * - EVENT
 * - DISCUSSION
 * - ALERT
 *
 * Design variants (from Figma badges):
 * - event        → purple
 * - lostFound    → red
 * - recommendation → green
 * - helpRequest  → yellow
 */
export function getChipVariantForCategory(
  categoryName: string | null | undefined,
): ChipVariant {
  if (!categoryName) {
    return 'default';
  }

  const normalized = categoryName.trim().toUpperCase() as PostCategory | string;

  switch (normalized) {
    case 'EVENT':
      return 'event';
    case 'ALERT':
      return 'lostFound';
    case 'DISCUSSION':
      return 'recommendation';
    case 'NEWS':
      return 'helpRequest';
    default:
      return 'default';
  }
}
