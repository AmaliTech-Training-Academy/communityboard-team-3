import { Skeleton } from '@/components/ui';

function CommentRowSkeleton() {
  return (
    <div className="flex flex-col gap-4 border-t border-default py-6 md:flex-row md:items-start md:justify-between">
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="avatar" className="h-12 w-12" />
          <div className="flex flex-col gap-[6px]">
            <Skeleton className="h-4 w-32 rounded-[999px]" />
            <Skeleton className="h-3 w-20 rounded-[999px]" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full max-w-[720px] rounded-[999px]" />
          <Skeleton className="h-3 w-full max-w-[560px] rounded-[999px]" />
        </div>
      </div>
    </div>
  );
}

export function PostDetailSkeleton() {
  const commentKeys = Array.from(
    { length: 3 },
    (_, i) => `comment-${String(i)}`,
  );

  return (
    <>
      <div className="inline-flex items-center gap-4 rounded-lg border border-default bg-page px-5 py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-[6px]" />
          <Skeleton className="h-4 w-12 rounded-[999px]" />
        </div>
        <Skeleton className="h-5 w-5 rounded-[6px]" />
        <Skeleton className="h-4 w-24 rounded-[999px]" />
      </div>

      <section className="flex flex-col">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-6">
            <Skeleton className="h-10 w-full max-w-[760px] rounded-[10px]" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-[25px] w-[70px] rounded-[999px]" />
              <Skeleton className="h-9 w-9 rounded-button" />
              <Skeleton className="h-9 w-9 rounded-button" />
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-full rounded-[999px]" />
            <Skeleton className="h-4 w-full rounded-[999px]" />
            <Skeleton className="h-4 w-2/3 rounded-[999px]" />
          </div>

          <div className="flex h-5 items-center gap-4">
            <Skeleton className="h-3 w-28 rounded-[999px]" />
            <Skeleton className="h-3 w-32 rounded-[999px]" />
          </div>

          <div className="h-px w-full border-t border-default" />
        </div>

        <div className="mt-10 flex flex-col items-end gap-[11px]">
          <div className="h-[218px] w-full rounded-lg border border-strong bg-overlay px-4 py-3">
            <div className="space-y-3">
              <Skeleton className="h-3 w-full rounded-[999px]" />
              <Skeleton className="h-3 w-11/12 rounded-[999px]" />
              <Skeleton className="h-3 w-4/5 rounded-[999px]" />
            </div>
          </div>
          <Skeleton
            variant="card"
            className="h-[41px] w-[345px] rounded-button"
          />
        </div>

        <section className="mt-5 space-y-10">
          <div className="flex items-center gap-[6px]">
            <Skeleton className="h-7 w-40 rounded-[999px]" />
            <Skeleton className="h-7 w-12 rounded-[999px]" />
          </div>

          <div className="flex flex-col">
            {commentKeys.map((key) => (
              <CommentRowSkeleton key={key} />
            ))}
          </div>
        </section>
      </section>
    </>
  );
}
