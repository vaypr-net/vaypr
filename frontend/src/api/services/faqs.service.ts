import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

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

export interface CreateFaqDto {
  question: string;
  answer: string;
  category: string;
  published?: boolean;
  order?: number;
}

export interface UpdateFaqDto {
  question?: string;
  answer?: string;
  category?: string;
  published?: boolean;
  order?: number;
}

export interface ReorderFaqDto {
  id: string;
  order: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const faqsService = {
  // Get all FAQs
  getAll: async (params?: { category?: string; publishedOnly?: boolean }): Promise<FAQ[]> => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.publishedOnly !== undefined) 
      queryParams.append('publishedOnly', params.publishedOnly.toString());
    
    const url = `${API_BASE_URL}/super-admin/faqs${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await axios.get<FAQ[]>(url, getAuthHeaders());
    return response.data;
  },

  // Get single FAQ
  getOne: async (id: string): Promise<FAQ> => {
    const response = await axios.get<FAQ>(
      `${API_BASE_URL}/super-admin/faqs/${id}`,
      getAuthHeaders()
    );
    return response.data;
  },

  // Get all categories
  getCategories: async (): Promise<string[]> => {
    const response = await axios.get<string[]>(
      `${API_BASE_URL}/super-admin/faqs/categories/list`,
      getAuthHeaders()
    );
    return response.data;
  },

  // Create FAQ
  create: async (data: CreateFaqDto): Promise<FAQ> => {
    const response = await axios.post<FAQ>(
      `${API_BASE_URL}/super-admin/faqs`,
      data,
      getAuthHeaders()
    );
    return response.data;
  },

  // Update FAQ
  update: async (id: string, data: UpdateFaqDto): Promise<FAQ> => {
    const response = await axios.patch<FAQ>(
      `${API_BASE_URL}/super-admin/faqs/${id}`,
      data,
      getAuthHeaders()
    );
    return response.data;
  },

  // Delete FAQ
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await axios.delete<{ message: string }>(
      `${API_BASE_URL}/super-admin/faqs/${id}`,
      getAuthHeaders()
    );
    return response.data;
  },

  // Reorder FAQs
  reorder: async (data: ReorderFaqDto[]): Promise<FAQ[]> => {
    const response = await axios.patch<FAQ[]>(
      `${API_BASE_URL}/super-admin/faqs/reorder/bulk`,
      { faqs: data },
      getAuthHeaders()
    );
    return response.data;
  },

  // Toggle published status
  togglePublished: async (id: string): Promise<FAQ> => {
    const response = await axios.patch<FAQ>(
      `${API_BASE_URL}/super-admin/faqs/${id}/toggle-published`,
      {},
      getAuthHeaders()
    );
    return response.data;
  },
};
