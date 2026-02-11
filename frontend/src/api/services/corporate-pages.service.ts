import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

export enum CorporatePageType {
  ABOUT = 'about',
  B2B = 'b2b',
  GUIDES = 'guides',
  CUSTOM = 'custom',
}

export interface ContentSection {
  title: string;
  content: string;
  order: number;
}

export interface TeamMember {
  name: string;
  position: string;
  bio: string;
  imageUrl?: string;
  order: number;
}

export interface ServiceFeature {
  title: string;
  description: string;
  icon?: string;
  order: number;
}

export interface CTASection {
  enabled: boolean;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

export interface CorporatePage {
  _id: string;
  slug: string;
  title: string;
  type: CorporatePageType;
  metaDescription?: string;
  icon?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  sections: ContentSection[];
  teamMembers?: TeamMember[];
  features?: ServiceFeature[];
  ctaSection?: CTASection;
  enabled: boolean;
  showInFooter: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCorporatePageDto {
  slug: string;
  title: string;
  type: CorporatePageType;
  metaDescription?: string;
  icon?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  sections?: ContentSection[];
  teamMembers?: TeamMember[];
  features?: ServiceFeature[];
  ctaSection?: CTASection;
  enabled?: boolean;
  showInFooter?: boolean;
  order?: number;
}

export interface UpdateCorporatePageDto {
  slug?: string;
  title?: string;
  type?: CorporatePageType;
  metaDescription?: string;
  icon?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  sections?: ContentSection[];
  teamMembers?: TeamMember[];
  features?: ServiceFeature[];
  ctaSection?: CTASection;
  enabled?: boolean;
  showInFooter?: boolean;
  order?: number;
}

export type GuideFileType = 'pdf' | 'image';

export interface Guide {
  _id: string;
  title: string;
  description: string;
  fileType: GuideFileType;
  fileName: string;
  fileUrl: string;
  published: boolean;
  downloads: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGuideDto {
  title: string;
  description: string;
  fileType: GuideFileType;
  fileName: string;
  fileUrl: string;
  published?: boolean;
}

export interface UpdateGuideDto extends Partial<CreateGuideDto> {}

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const corporatePagesService = {
  // Public endpoints
  getAll: async (params?: { enabledOnly?: boolean }): Promise<CorporatePage[]> => {
    const queryParams = new URLSearchParams();
    if (params?.enabledOnly !== undefined) 
      queryParams.append('enabledOnly', params.enabledOnly.toString());
    
    const url = `${API_BASE_URL}/corporate${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await axios.get<CorporatePage[]>(url);
    return response.data;
  },

  getBySlug: async (slug: string): Promise<CorporatePage> => {
    const response = await axios.get<CorporatePage>(`${API_BASE_URL}/corporate/slug/${slug}`);
    return response.data;
  },

  getByType: async (type: CorporatePageType): Promise<CorporatePage> => {
    const response = await axios.get<CorporatePage>(`${API_BASE_URL}/corporate/type/${type}`);
    return response.data;
  },

  getOne: async (id: string): Promise<CorporatePage> => {
    const response = await axios.get<CorporatePage>(`${API_BASE_URL}/corporate/${id}`);
    return response.data;
  },

  // Admin endpoints (protected)
  create: async (data: CreateCorporatePageDto): Promise<CorporatePage> => {
    const response = await axios.post<CorporatePage>(
      `${API_BASE_URL}/corporate/admin`,
      data,
      getAuthHeaders()
    );
    return response.data;
  },

  update: async (id: string, data: UpdateCorporatePageDto): Promise<CorporatePage> => {
    const response = await axios.patch<CorporatePage>(
      `${API_BASE_URL}/corporate/admin/${id}`,
      data,
      getAuthHeaders()
    );
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await axios.delete<{ message: string }>(
      `${API_BASE_URL}/corporate/admin/${id}`,
      getAuthHeaders()
    );
    return response.data;
  },

  toggleEnabled: async (id: string): Promise<CorporatePage> => {
    const response = await axios.patch<CorporatePage>(
      `${API_BASE_URL}/corporate/admin/${id}/toggle`,
      {},
      getAuthHeaders()
    );
    return response.data;
  },

  toggleFooterVisibility: async (id: string): Promise<CorporatePage> => {
    const response = await axios.patch<CorporatePage>(
      `${API_BASE_URL}/corporate/admin/${id}/toggle-footer`,
      {},
      getAuthHeaders()
    );
    return response.data;
  },

  initializeDefaults: async (): Promise<CorporatePage[]> => {
    const response = await axios.post<CorporatePage[]>(
      `${API_BASE_URL}/corporate/admin/init-defaults`,
      {},
      getAuthHeaders()
    );
    return response.data;
  },

  // Guides
  getAllGuides: async (params?: { publishedOnly?: boolean }): Promise<Guide[]> => {
    const queryParams = new URLSearchParams();
    if (params?.publishedOnly !== undefined) {
      queryParams.append('publishedOnly', params.publishedOnly.toString());
    }

    const url = `${API_BASE_URL}/corporate/guides${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await axios.get<Guide[]>(url);
    return response.data;
  },

  getGuideById: async (id: string): Promise<Guide> => {
    const response = await axios.get<Guide>(`${API_BASE_URL}/corporate/guides/${id}`);
    return response.data;
  },

  createGuide: async (data: CreateGuideDto): Promise<Guide> => {
    const response = await axios.post<Guide>(
      `${API_BASE_URL}/corporate/admin/guides`,
      data,
      getAuthHeaders()
    );
    return response.data;
  },

  updateGuide: async (id: string, data: UpdateGuideDto): Promise<Guide> => {
    const response = await axios.patch<Guide>(
      `${API_BASE_URL}/corporate/admin/guides/${id}`,
      data,
      getAuthHeaders()
    );
    return response.data;
  },

  toggleGuidePublished: async (id: string): Promise<Guide> => {
    const response = await axios.patch<Guide>(
      `${API_BASE_URL}/corporate/admin/guides/${id}/toggle`,
      {},
      getAuthHeaders()
    );
    return response.data;
  },

  deleteGuide: async (id: string): Promise<{ message: string }> => {
    const response = await axios.delete<{ message: string }>(
      `${API_BASE_URL}/corporate/admin/guides/${id}`,
      getAuthHeaders()
    );
    return response.data;
  },
};
