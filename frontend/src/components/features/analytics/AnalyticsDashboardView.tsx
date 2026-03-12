import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, Text } from '@/components/ui';
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

const ALL_CATEGORIES = ['NEWS', 'EVENT', 'DISCUSSION', 'ALERT'] as const;

const DAY_OF_WEEK_LABELS: { key: number; label: string }[] = [
  { key: 1, label: 'Mon' },
  { key: 2, label: 'Tues' },
  { key: 3, label: 'Wed' },
  { key: 4, label: 'Thurs' },
  { key: 5, label: 'Fri' },
  { key: 6, label: 'Sat' },
  { key: 0, label: 'Sun' },
];

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
      ALL_CATEGORIES.map((category) => {
        const match = postsPerCategoryRaw?.find(
          (entry) => entry.category === category,
        );
        return {
          category,
          label: getCategoryDisplayName(category),
          count: match?.count ?? 0,
        };
      }),
    [postsPerCategoryRaw],
  );

  const totalPosts = useMemo(
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

  const totalComments = useMemo(
    () => (dailyActivity ?? []).reduce((sum, entry) => sum + entry.count, 0),
    [dailyActivity],
  );

  const hasContributors = Boolean(topContributors?.length);

  return (
    <div className="space-y-6">
      {/* Breadcrumb – matches post detail breadcrumb styling */}
      <div className="inline-flex items-center gap-4 rounded-lg border border-default bg-page px-5 py-3">
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

      {/* Summary cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:max-w-[480px]">
        <Card className="px-5 py-4">
          <div className="mb-1 flex items-center justify-between gap-3">
            <Text variant="bodySmRegular" className="text-secondary">
              Total Posts
            </Text>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-primary-50)">
              <img src={trendingUpIcon} alt="" className="h-4 w-4" />
            </div>
          </div>
          <Text as="p" variant="headingAuth" className="text-primary">
            {isLoadingCategories ? '—' : totalPosts.toString()}
          </Text>
        </Card>

        <Card className="px-5 py-4">
          <div className="mb-1 flex items-center justify-between gap-3">
            <Text variant="bodySmRegular" className="text-secondary">
              Total Comments
            </Text>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-primary-50)">
              <img src={messagesIcon} alt="" className="h-4 w-4" />
            </div>
          </div>
          <Text as="p" variant="headingAuth" className="text-primary">
            {isLoadingActivity ? '—' : totalComments.toString()}
          </Text>
        </Card>
      </section>

      {/* Charts */}
      <section className="grid gap-6 md:grid-cols-2">
        <Card className="h-[320px] space-y-4 px-6 py-5">
          <Text variant="bodySmRegular" className="text-primary font-semibold">
            Posts by Category
          </Text>
          {isLoadingCategories ? (
            <Text variant="bodySm" className="text-secondary">
              Loading posts by category...
            </Text>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={postsPerCategory} barCategoryGap={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(15, 40, 57, 0.06)', radius: 4 }}
                  wrapperStyle={{ outline: 'none' }}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid var(--color-slate-300)',
                    boxShadow:
                      '0px 1px 2px rgba(0, 0, 0, 0.06), 0px 1px 3px rgba(0, 0, 0, 0.1)',
                  }}
                  labelStyle={{ fontSize: 12, color: 'var(--color-secondary)' }}
                  itemStyle={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--color-primary-950)',
                  }}
                />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  fill="var(--color-primary-950)"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="h-[320px] space-y-4 px-6 py-5">
          <Text variant="bodySmRegular" className="text-primary font-semibold">
            Posts Day of Week
          </Text>
          {isLoadingActivity ? (
            <Text variant="bodySm" className="text-secondary">
              Loading posts by day of week...
            </Text>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={postsByDayOfWeek} barCategoryGap={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(15, 40, 57, 0.06)', radius: 4 }}
                  wrapperStyle={{ outline: 'none' }}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid var(--color-slate-300)',
                    boxShadow:
                      '0px 1px 2px rgba(0, 0, 0, 0.06), 0px 1px 3px rgba(0, 0, 0, 0.1)',
                  }}
                  labelStyle={{ fontSize: 12, color: 'var(--color-secondary)' }}
                  itemStyle={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--color-primary-950)',
                  }}
                />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  fill="var(--color-primary-600)"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </section>

      {/* Top contributors table */}
      <Card className="space-y-4 px-5 py-4">
        <Text variant="bodyBase" className="text-primary font-semibold">
          Top 10 Contributors
        </Text>
        {(() => {
          if (isLoadingContributors) {
            return (
              <Text variant="bodySm" className="text-secondary">
                Loading top contributors...
              </Text>
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
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-overlay">
                  <tr>
                    <th className="px-4 py-2 text-left text-bodySmRegular text-secondary font-medium">
                      Ranks
                    </th>
                    <th className="px-4 py-2 text-left text-bodySmRegular text-secondary font-medium">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-bodySmRegular text-secondary font-medium">
                      Posts
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topContributors.map((contributor, index) => (
                    <tr
                      key={contributor.username}
                      className="border-b border-default last:border-b-0"
                    >
                      <td className="px-4 py-2 align-middle text-bodySm text-secondary">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-overlay text-xs font-medium text-inverse">
                            {contributor.username.charAt(0).toUpperCase()}
                          </div>
                          <Text variant="bodyBase" className="text-primary">
                            {contributor.username}
                          </Text>
                        </div>
                      </td>
                      <td className="px-4 py-2 align-middle text-bodySm text-secondary">
                        {contributor.postCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </Card>
    </div>
  );
}
