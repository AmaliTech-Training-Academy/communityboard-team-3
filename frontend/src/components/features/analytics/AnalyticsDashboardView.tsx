import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, Skeleton, Text } from '@/components/ui';
import {
  useDailyActivity,
  usePostsPerCategory,
  useTopContributors,
} from '@/hooks/useAnalytics';
import { getCategoryDisplayName } from '@/utils/postCategory';
import houseIcon from '@/assets/house.svg';
import chevronRightIcon from '@/assets/chevron-right.svg';
import trendingUpIcon from '@/assets/trending-up.svg';
import messagesIcon from '@/assets/message-circle-more.svg';

const DAY_OF_WEEK_LABELS: { key: number; label: string }[] = [
  { key: 1, label: 'Mon' },
  { key: 2, label: 'Tues' },
  { key: 3, label: 'Wed' },
  { key: 4, label: 'Thurs' },
  { key: 5, label: 'Fri' },
  { key: 6, label: 'Sat' },
  { key: 0, label: 'Sun' },
];

const AXIS_TICK_STYLE = {
  fontSize: 12,
  fill: 'var(--color-text-muted)',
  fontWeight: 500,
} as const;

type AxisTickPayload = {
  value?: string;
};

type CategoryTickProps = {
  x?: number;
  y?: number;
  payload?: AxisTickPayload;
};

function splitCategoryLabel(label: string): string[] {
  if (label === 'Recommendations') return ['Recommendati', 'ons'];
  return [label];
}

function CategoryTick({ x = 0, y = 0, payload }: Readonly<CategoryTickProps>) {
  const label = payload?.value ?? '';
  const lines = splitCategoryLabel(label);

  return (
    <g transform={`translate(${String(x)},${String(y)})`}>
      <text
        y={12}
        textAnchor="middle"
        fill="var(--color-text-muted)"
        fontSize={12}
        fontWeight={500}
      >
        {lines.map((line, index) => (
          <tspan
            key={`${label}-${String(index)}`}
            x={0}
            dy={index === 0 ? 0 : 18}
          >
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function CountTooltip({
  active,
  payload,
}: Readonly<TooltipProps<number, string>>) {
  const value = payload?.[0]?.value;
  if (!active || value == null) return null;

  return (
    <div className="flex h-8 items-center justify-center rounded-lg bg-(--color-primary-900) px-4 text-[12px] font-medium leading-[1.5] text-inverse">
      Count: {String(value)}
    </div>
  );
}

export function AnalyticsDashboardView() {
  const navigate = useNavigate();

  const { data: postsPerCategoryRaw, isLoading: isLoadingCategories } =
    usePostsPerCategory();
  const { data: dailyActivity, isLoading: isLoadingActivity } =
    useDailyActivity(30);
  const { data: topContributors, isLoading: isLoadingContributors } =
    useTopContributors(10);

  const postsPerCategory = useMemo(
    () =>
      (postsPerCategoryRaw ?? []).map((entry) => ({
        category: entry.category,
        label: getCategoryDisplayName(entry.category),
        count: entry.count,
      })),
    [postsPerCategoryRaw],
  );

  const totalPostsFromCategories = useMemo(
    () => postsPerCategory.reduce((sum, entry) => sum + entry.count, 0),
    [postsPerCategory],
  );

  const postsByDayOfWeek = useMemo(() => {
    const countsByDay: Record<number, number> = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
    };

    (dailyActivity ?? []).forEach((entry) => {
      const date = new Date(entry.date);
      const day = Number.isNaN(date.getTime()) ? null : date.getDay();
      if (day === null) return;
      countsByDay[day] += entry.count;
    });

    return DAY_OF_WEEK_LABELS.map(({ key, label }) => ({
      day: label,
      count: countsByDay[key] ?? 0,
    }));
  }, [dailyActivity]);

  const totalCommentsFromActivity = useMemo(
    () => (dailyActivity ?? []).reduce((sum, entry) => sum + entry.count, 0),
    [dailyActivity],
  );

  const totalPosts: number = totalPostsFromCategories;
  const totalComments: number = totalCommentsFromActivity;

  const hasContributors = Boolean(topContributors?.length);

  return (
    <div className="flex flex-col gap-8">
      <div className="inline-flex self-start items-center gap-4 rounded-lg border border-default bg-page px-5 py-3">
        <button
          type="button"
          className="flex items-center gap-2 text-body-sm-regular text-primary"
          onClick={() => {
            void navigate('/');
          }}
        >
          <img src={houseIcon} alt="" className="h-5 w-5" />
          <span>Home</span>
        </button>
        <img src={chevronRightIcon} alt="" className="h-5 w-5 text-muted" />
        <Text variant="bodySmRegular" className="text-primary">
          Analytics
        </Text>
      </div>

      <section className="mt-8 flex w-full max-w-[811px] flex-col gap-8 sm:flex-row">
        <Card className="min-h-[168px] w-full rounded-[14px] p-6 sm:w-[389.328px]">
          <div className="flex items-center justify-between">
            <Text
              as="p"
              className="text-[24px] font-medium leading-[1.5] text-[color:var(--color-slate-700)]"
            >
              Total Posts
            </Text>
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-(--color-chip-light-blue-fill) p-2">
              <img src={trendingUpIcon} alt="" className="h-5 w-5" />
            </div>
          </div>
          {isLoadingCategories ? (
            <Skeleton className="mt-2 h-[48px] w-24 rounded-[10px]" />
          ) : (
            <p className="font-[var(--font-family-heading)] text-[48px] font-bold leading-[1.5] text-[color:var(--color-primary)]">
              {totalPosts.toString()}
            </p>
          )}
        </Card>

        <Card className="min-h-[168px] w-full rounded-[14px] p-6 sm:w-[389.328px]">
          <div className="flex items-center justify-between">
            <Text
              as="p"
              className="text-[24px] font-medium leading-[1.5] text-[color:var(--color-slate-700)]"
            >
              Total Comments
            </Text>
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-(--color-chip-light-blue-fill) p-2">
              <img src={messagesIcon} alt="" className="h-5 w-5" />
            </div>
          </div>
          {isLoadingActivity ? (
            <Skeleton className="mt-2 h-[48px] w-24 rounded-[10px]" />
          ) : (
            <p className="font-[var(--font-family-heading)] text-[48px] font-bold leading-[1.5] text-[color:var(--color-primary)]">
              {totalComments.toString()}
            </p>
          )}
        </Card>
      </section>

      <section className="flex flex-col gap-8 md:flex-row md:gap-[50px]">
        <Card className="flex h-[362.75px] w-full flex-col gap-4 rounded-lg p-4 md:w-[576px]">
          <Text
            as="h2"
            className="py-2 font-[var(--font-family-heading)] text-[24px] font-semibold leading-[1.5] text-[color:var(--color-primary)]"
          >
            Posts by Category
          </Text>

          {isLoadingCategories ? (
            <div className="h-[262.75px] w-full">
              <Skeleton variant="card" className="h-full w-full rounded-lg" />
            </div>
          ) : (
            <div className="h-[262.75px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={postsPerCategory} barCategoryGap={72}>
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--color-slate-300)"
                    strokeDasharray="4 4"
                  />
                  <ReferenceLine
                    ifOverflow="extendDomain"
                    y={20}
                    stroke="var(--color-brand-blue-700)"
                    strokeDasharray="4 4"
                  />
                  <XAxis
                    dataKey="label"
                    height={36}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    tick={(props: CategoryTickProps) => (
                      <CategoryTick {...props} />
                    )}
                  />
                  <YAxis
                    allowDecimals={false}
                    width={20}
                    axisLine={false}
                    tickLine={false}
                    tick={AXIS_TICK_STYLE}
                  />
                  <Tooltip cursor={false} content={<CountTooltip />} />
                  <Bar
                    dataKey="count"
                    barSize={74}
                    fill="var(--color-slate-700)"
                    radius={0}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="flex h-[362.75px] w-full flex-col gap-4 rounded-lg p-4 md:w-[576px]">
          <Text
            as="h2"
            className="py-2 font-[var(--font-family-heading)] text-[24px] font-semibold leading-[1.5] text-[color:var(--color-primary)]"
          >
            Posts Day of Week
          </Text>

          {isLoadingActivity ? (
            <div className="h-[248.75px] w-full">
              <Skeleton variant="card" className="h-full w-full rounded-lg" />
            </div>
          ) : (
            <div className="h-[248.75px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={postsByDayOfWeek} barCategoryGap={24}>
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--color-slate-300)"
                    strokeDasharray="4 4"
                  />
                  <ReferenceLine
                    ifOverflow="extendDomain"
                    y={20}
                    stroke="var(--color-brand-blue-700)"
                    strokeDasharray="4 4"
                  />
                  <XAxis
                    dataKey="day"
                    height={36}
                    axisLine={false}
                    tickLine={false}
                    tick={AXIS_TICK_STYLE}
                  />
                  <YAxis
                    allowDecimals={false}
                    width={20}
                    axisLine={false}
                    tickLine={false}
                    tick={AXIS_TICK_STYLE}
                  />
                  <Tooltip cursor={false} content={<CountTooltip />} />
                  <Bar
                    dataKey="count"
                    barSize={50}
                    fill="var(--color-slate-700)"
                    radius={0}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <Text
          as="h2"
          className="text-[16px] font-semibold leading-[1.5] text-[color:var(--color-primary)]"
        >
          Top 10 Contributors
        </Text>

        {(() => {
          if (isLoadingContributors) {
            return (
              <div className="overflow-x-auto rounded-lg border border-default bg-surface">
                <div className="min-w-full">
                  <div className="flex h-14 items-center gap-4 bg-(--color-slate-300) px-4">
                    <Skeleton className="h-4 w-16 rounded-[999px]" />
                    <Skeleton className="h-4 w-24 rounded-[999px]" />
                    <Skeleton className="h-4 w-16 rounded-[999px]" />
                  </div>
                  {Array.from({ length: 6 }, (_, i) => `row-${String(i)}`).map(
                    (key) => (
                      <div
                        key={key}
                        className="flex h-14 items-center gap-4 border-b border-default px-4 last:border-b-0"
                      >
                        <Skeleton className="h-4 w-10 rounded-[999px]" />
                        <Skeleton className="h-4 w-48 rounded-[999px]" />
                        <Skeleton className="h-4 w-12 rounded-[999px]" />
                      </div>
                    ),
                  )}
                </div>
              </div>
            );
          }

          if (!hasContributors || !topContributors) {
            return (
              <Text variant="bodySm" className="text-secondary">
                No contributors to display yet.
              </Text>
            );
          }

          return (
            <div className="overflow-x-auto rounded-lg border border-default bg-surface">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-(--color-slate-300)">
                  <tr className="h-14">
                    <th className="w-[96px] px-4 py-4 text-[14px] font-medium leading-[1.5] text-[color:var(--color-slate-700)]">
                      Ranks
                    </th>
                    <th className="px-4 py-4 text-[14px] font-medium leading-[1.5] text-[color:var(--color-slate-700)]">
                      Name
                    </th>
                    <th className="w-[140px] px-4 py-4 text-[14px] font-medium leading-[1.5] text-[color:var(--color-slate-700)]">
                      Posts
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topContributors.map((contributor, index) => (
                    <tr
                      key={contributor.username}
                      className="h-14 border-b border-default last:border-b-0"
                    >
                      <td className="px-4 py-4 text-[16px] font-normal leading-[1.5] text-[color:var(--color-primary)]">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 text-[16px] font-normal leading-[1.5] text-[color:var(--color-primary)]">
                        {contributor.username}
                      </td>
                      <td className="px-4 py-4 text-[16px] font-normal leading-[1.5] text-[color:var(--color-primary)]">
                        {contributor.postCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </section>
    </div>
  );
}
