import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface PublicFAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  published: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export const publicFaqsService = {
  // Get all published FAQs
  getPublished: async (category?: string): Promise<PublicFAQ[]> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);

    const url = `${API_BASE_URL}/faqs/published${params.toString() ? `?${params}` : ''}`;
    const response = await axios.get<PublicFAQ[]>(url);
    return response.data;
  },

  // Get all categories with published FAQs
  getPublicCategories: async (): Promise<string[]> => {
    const response = await axios.get<string[]>(`${API_BASE_URL}/faqs/categories/public`);
    return response.data;
  },
};
