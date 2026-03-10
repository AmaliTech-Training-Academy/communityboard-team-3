import { Button, Chip, Text } from '@/components/ui';
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
}: Readonly<PostsToolbarProps>) {
  return (
    <section className="space-y-4">
      {/* Top row: search + primary action */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full max-w-[691px]">
          <PostsSearchBar />
        </div>
        <div className="lg:self-stretch">
          <Button
            variant="primary"
            leftIcon={<img src={plusIcon} alt="" className="h-5 w-5" />}
            className="gap-2 px-[20px] py-[10px]"
          >
            Create post
          </Button>
        </div>
      </div>

      {/* Categories row */}
      <div className="flex flex-wrap items-center gap-4">
        <Text variant="bodyBase" className="text-primary">
          Categories:
        </Text>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const isActive = category === activeCategory;
            const activeClasses =
              'bg-[color:var(--color-slate-400)] text-[color:var(--color-primary-950)] border-[color:var(--color-slate-700)]';
            const inactiveClasses =
              'bg-[color:var(--color-slate-200)] text-[color:var(--color-primary-950)] border-[color:var(--color-slate-700)]';

            return (
              <Chip
                key={category}
                variant="default"
                onClick={() => {
                  if (onCategoryChange) {
                    onCategoryChange(category);
                  }
                }}
                className={`cursor-pointer ${isActive ? activeClasses : inactiveClasses}`}
              >
                {category}
              </Chip>
            );
          })}
        </div>
      </div>
    </section>
  );
}
