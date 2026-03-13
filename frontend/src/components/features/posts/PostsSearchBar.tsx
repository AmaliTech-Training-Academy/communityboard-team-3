import { Button, TextField } from '@/components/ui';
import searchIcon from '@/assets/search.svg';
import searchOnDarkIcon from '@/assets/search-on-dark.svg';
import clearIcon from '@/assets/x.svg';

type PostsSearchBarProps = {
  value: string;
  onChange: (next: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
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
  value,
  onChange,
  onSubmit,
  onClear,
}: Readonly<PostsSearchBarProps>) {
  return (
    <div className="flex h-[42px] w-full items-stretch gap-3">
      <div className="flex-1">
        <TextField
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && onSubmit) {
              event.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Search by title of post..."
          aria-label="Search posts by title"
          className="placeholder:text-secondary"
          leftIcon={<img src={searchIcon} alt="Search" className="h-4 w-4" />}
          rightIcon={<img src={clearIcon} alt="" className="h-4 w-4" />}
          rightIconAriaLabel="Clear search"
          onRightIconClick={() => {
            if (onClear) {
              onClear();
            } else {
              onChange('');
            }
          }}
        />
      </div>
      <div className="hidden md:flex md:h-full md:shrink-0">
        <Button
          aria-label="Search posts"
          variant="primary"
          className="h-full rounded-lg border border-(--color-primary-900) px-3 py-2.5"
          onClick={onSubmit}
        >
          <img src={searchOnDarkIcon} alt="Search" className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
