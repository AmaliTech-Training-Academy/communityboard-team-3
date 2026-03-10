/**
 * Small, reusable loading spinner that uses the existing design
 * tokens (colors, sizes) instead of inventing new visuals.
 *
 * Use this when:
 * - a specific part of the UI is loading (e.g. a section, small card)
 * - you need a compact indicator, not a full-page loader
 *
 * For whole-screen loading (like route guards), prefer `PageLoader`.
 */
export function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--toast-success-icon)] border-t-transparent"
    />
  );
}

