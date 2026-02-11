import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

export enum PageType {
  CONTACT = 'CONTACT',
  PRIVACY = 'PRIVACY',
  REFUND = 'REFUND',
  ABOUT = 'ABOUT',
  B2B = 'B2B',
  CUSTOM = 'CUSTOM',
}

export interface ContentSection {
  title: string;
  content: string;
  order: number;
}

export interface ContactFormSettings {
  enabled: boolean;
  recipientEmail: string;
  subjectOptions: string[];
  responseMessage: string;
}

export interface SupportPage {
  _id: string;
  slug: string;
  title: string;
  type: PageType;
  metaDescription?: string;
  icon?: string;
  sections: ContentSection[];
  contactFormSettings?: ContactFormSettings;
  enabled: boolean;
  showInFooter: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupportPageDto {
  slug: string;
  title: string;
  type: PageType;
  metaDescription?: string;
  icon?: string;
  sections?: ContentSection[];
  contactFormSettings?: ContactFormSettings;
  enabled?: boolean;
  showInFooter?: boolean;
  order?: number;
}

export interface UpdateSupportPageDto {
  slug?: string;
  title?: string;
  type?: PageType;
  metaDescription?: string;
  icon?: string;
  sections?: ContentSection[];
  contactFormSettings?: ContactFormSettings;
  enabled?: boolean;
  showInFooter?: boolean;
  order?: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const supportPagesService = {
  // Public endpoints
  getAll: async (params?: { enabledOnly?: boolean }): Promise<SupportPage[]> => {
    const queryParams = new URLSearchParams();
    if (params?.enabledOnly !== undefined) 
      queryParams.append('enabledOnly', params.enabledOnly.toString());
    
    const url = `${API_BASE_URL}/pages${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await axios.get<SupportPage[]>(url);
    return response.data;
  },

  getBySlug: async (slug: string): Promise<SupportPage> => {
    const response = await axios.get<SupportPage>(`${API_BASE_URL}/pages/slug/${slug}`);
    return response.data;
  },

  getByType: async (type: PageType): Promise<SupportPage> => {
    const response = await axios.get<SupportPage>(`${API_BASE_URL}/pages/type/${type}`);
    return response.data;
  },

  getOne: async (id: string): Promise<SupportPage> => {
    const response = await axios.get<SupportPage>(`${API_BASE_URL}/pages/${id}`);
    return response.data;
  },

  // Admin endpoints (protected)
  create: async (data: CreateSupportPageDto): Promise<SupportPage> => {
    const response = await axios.post<SupportPage>(
      `${API_BASE_URL}/pages/admin`,
      data,
      getAuthHeaders()
    );
    return response.data;
  },

  update: async (id: string, data: UpdateSupportPageDto): Promise<SupportPage> => {
    const response = await axios.patch<SupportPage>(
      `${API_BASE_URL}/pages/admin/${id}`,
      data,
      getAuthHeaders()
    );
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await axios.delete<{ message: string }>(
      `${API_BASE_URL}/pages/admin/${id}`,
      getAuthHeaders()
    );
    return response.data;
  },

  toggleEnabled: async (id: string): Promise<SupportPage> => {
    const response = await axios.patch<SupportPage>(
      `${API_BASE_URL}/pages/admin/${id}/toggle`,
      {},
      getAuthHeaders()
    );
    return response.data;
  },

  toggleFooterVisibility: async (id: string): Promise<SupportPage> => {
    const response = await axios.patch<SupportPage>(
      `${API_BASE_URL}/pages/admin/${id}/toggle-footer`,
      {},
      getAuthHeaders()
    );
    return response.data;
  },

  initializeDefaults: async (): Promise<SupportPage[]> => {
    const response = await axios.post<SupportPage[]>(
      `${API_BASE_URL}/pages/admin/init-defaults`,
      {},
      getAuthHeaders()
    );
    return response.data;
  },
};
