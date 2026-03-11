import { AppShell } from '@/layout/AppShell';
import { PostsToolbar } from '@/components/features/posts/PostsToolbar';
import { PostList } from '@/components/features/posts/PostList';

export default function HomePage() {
  return (
    <AppShell>
      <PostsToolbar />
      <PostList />
    </AppShell>
  );
}
