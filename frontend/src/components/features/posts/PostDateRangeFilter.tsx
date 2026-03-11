import { Text, TextField, Button } from '@/components/ui';

type PostDateRangeFilterProps = {
  startDate: string;
  endDate: string;
  onStartChange: (next: string) => void;
  onEndChange: (next: string) => void;
  onClear: () => void;
};

export function PostDateRangeFilter({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onClear,
}: Readonly<PostDateRangeFilterProps>) {
  return (
    <section className="mt-4 flex flex-col gap-3 rounded-lg border border-default bg-page px-4 py-3 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-1 flex-col gap-3 md:flex-row">
        <div className="flex-1">
          <TextField
            type="date"
            label="Start date"
            value={startDate}
            onChange={(event) => {
              onStartChange(event.target.value);
            }}
          />
        </div>
        <div className="flex-1">
          <TextField
            type="date"
            label="End date"
            value={endDate}
            onChange={(event) => {
              onEndChange(event.target.value);
            }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 md:self-auto">
        <Text variant="bodySm" className="text-secondary">
          Filter posts by created date range.
        </Text>
        <Button
          type="button"
          variant="ghost"
          className="px-3 py-1.5"
          onClick={onClear}
        >
          Clear dates
        </Button>
      </div>
    </section>
  );
}
