export type PostCategory = 'NEWS' | 'EVENT' | 'DISCUSSION' | 'ALERT';

export interface PostSummary {
  id: number;
  title: string;
  content: string;
  categoryName: string;
  categoryId: number | null;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
}

export interface PaginatedPosts {
  content: PostSummary[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
