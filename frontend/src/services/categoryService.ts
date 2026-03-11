import { apiClient } from '@/services/api';
import type { Category } from '@/types/category';

const BASE_PATH = '/categories';

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const { data } = await apiClient.get<Category[]>(BASE_PATH);
    return data;
  },
};
