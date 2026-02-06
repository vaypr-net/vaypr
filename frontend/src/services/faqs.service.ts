import api from './api';

export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  published: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFAQDto {
  question: string;
  answer: string;
  category: string;
  published?: boolean;
  order?: number;
}

export interface UpdateFAQDto {
  question?: string;
  answer?: string;
  category?: string;
  published?: boolean;
  order?: number;
}

export interface ReorderFAQDto {
  faqId: string;
  newOrder: number;
}

export const faqsService = {
  // Get all FAQs
  getAll: async (category?: string): Promise<FAQ[]> => {
    const params = category ? { category } : {};
    const response = await api.get<FAQ[]>('/super-admin/faqs', { params });
    return response.data;
  },

  // Get single FAQ
  getOne: async (id: string): Promise<FAQ> => {
    const response = await api.get<FAQ>(`/super-admin/faqs/${id}`);
    return response.data;
  },

  // Get unique categories
  getCategories: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/super-admin/faqs/categories/list');
    return response.data;
  },

  // Create FAQ
  create: async (dto: CreateFAQDto): Promise<FAQ> => {
    const response = await api.post<FAQ>('/super-admin/faqs', dto);
    return response.data;
  },

  // Update FAQ
  update: async (id: string, dto: UpdateFAQDto): Promise<FAQ> => {
    const response = await api.patch<FAQ>(`/super-admin/faqs/${id}`, dto);
    return response.data;
  },

  // Delete FAQ
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/super-admin/faqs/${id}`);
    return response.data;
  },

  // Toggle published status
  togglePublished: async (id: string): Promise<FAQ> => {
    const response = await api.patch<FAQ>(`/super-admin/faqs/${id}/toggle`);
    return response.data;
  },

  // Reorder FAQ
  reorder: async (id: string, newOrder: number): Promise<FAQ> => {
    const response = await api.patch<FAQ>(`/super-admin/faqs/${id}/reorder`, { newOrder });
    return response.data;
  },
};
