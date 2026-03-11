import { Button, TextField } from '@/components/ui';
import searchIcon from '@/assets/search.svg';
import searchOnDarkIcon from '@/assets/search-on-dark.svg';
import clearIcon from '@/assets/x.svg';

type PostsSearchBarProps = {
  onSearchClick?: () => void;
};

/**
 * Search section of the posts home page.
 * Matches the Figma layout for:
 * - search input with icon
 * - small search button on the right (desktop)
 *
 * Category chips and "Create post" live in sibling components
 * so each piece has a single responsibility.
 */
export function PostsSearchBar({
  onSearchClick,
}: Readonly<PostsSearchBarProps>) {
  return (
    <div className="flex w-full items-stretch gap-[10px]">
      <div className="flex-1">
        <TextField
          placeholder="Search by title of post..."
          aria-label="Search posts by title"
          leftIcon={<img src={searchIcon} alt="Search" className="h-4 w-4" />}
          rightIcon={<img src={clearIcon} alt="" className="h-4 w-4" />}
          rightIconAriaLabel="Clear search"
        />
      </div>
      <div className="hidden md:flex md:h-full md:flex-shrink-0">
        <Button
          aria-label="Search posts"
          variant="primary"
          className="h-full px-[12px] py-[10px]"
          onClick={onSearchClick}
        >
          <img src={searchOnDarkIcon} alt="Search" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
