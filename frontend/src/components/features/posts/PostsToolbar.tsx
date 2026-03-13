import { Button, Text } from '@/components/ui';
import plusIcon from '@/assets/plus.svg';
import { PostsSearchBar } from './PostsSearchBar';

export type PostsToolbarProps = {
  /**
   * List of category labels to display in the chip row.
   * Typically built from backend categories plus an "All" entry.
   */
  categories: string[];
  /**
   * Currently active category label.
   * The implementation is purely visual for now; wiring to
   * post filters can be added once the API supports it.
   */
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
  searchValue: string;
  onSearchChange: (next: string) => void;
  onSearchSubmit?: () => void;
  onCreatePostClick?: () => void;
};

/**
 * Toolbar for the posts home page.
 * Mirrors the Figma layout:
 * - search input
 * - primary "Create post" button
 * - row of category badges
 */
export function PostsToolbar({
  categories,
  activeCategory = 'All',
  onCategoryChange,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onCreatePostClick,
}: Readonly<PostsToolbarProps>) {
  return (
    <section className="space-y-8">
      {/* Top row: search + primary action */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full max-w-[691px]">
          <PostsSearchBar
            value={searchValue}
            onChange={onSearchChange}
            onSubmit={onSearchSubmit}
            onClear={() => {
              onSearchChange('');
              if (onSearchSubmit) {
                onSearchSubmit();
              }
            }}
          />
        </div>
        <div className="lg:self-stretch">
          <Button
            variant="primary"
            leftIcon={<img src={plusIcon} alt="" className="h-5 w-5" />}
            className="gap-2 px-[20px] py-[10px]"
            onClick={onCreatePostClick}
          >
            Create post
          </Button>
        </div>
      </div>

      {/* Categories row */}
      <div className="flex flex-wrap items-center gap-4">
        <Text
          variant="bodyBase"
          className="font-normal text-[color:var(--color-primary-900)]"
        >
          Categories:
        </Text>
        <div className="flex flex-wrap gap-[10px]">
          {categories.map((category) => {
            const isActive = category === activeCategory;

            return (
              <button
                key={category}
                type="button"
                onClick={() => {
                  onCategoryChange?.(category);
                }}
                className={[
                  'inline-flex items-center justify-center whitespace-nowrap',
                  'rounded-[6px] border border-[color:var(--color-slate-700)] px-3 py-0.5 text-body-sm',
                  'cursor-pointer',
                  'text-[color:var(--color-primary-900)]',
                  isActive ? 'bg-(--color-slate-400)' : 'bg-surface',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
