import { Button, Chip, Text } from '@/components/ui';
import plusIcon from '@/assets/plus.svg';
import { PostsSearchBar } from './PostsSearchBar';

const CATEGORIES = [
  'All',
  'Events',
  'Lost & Found',
  'Recommendations',
  'Help Requests',
] as const;

type Category = (typeof CATEGORIES)[number];

export type PostsToolbarProps = {
  /**
   * Currently active category filter.
   * The initial implementation is purely visual; wiring to
   * post filters can be added once the API supports it.
   */
  activeCategory?: Category;
  onCategoryChange?: (category: Category) => void;
};

/**
 * Toolbar for the posts home page.
 * Mirrors the Figma layout:
 * - search input
 * - primary "Create post" button
 * - row of category badges
 */
export function PostsToolbar({
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
          {CATEGORIES.map((category) => {
            const isActive = category === activeCategory;
            return (
              <Chip
                key={category}
                variant={isActive ? 'event' : 'default'}
                onClick={() => {
                  if (onCategoryChange) {
                    onCategoryChange(category);
                  }
                }}
                className="cursor-pointer"
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
