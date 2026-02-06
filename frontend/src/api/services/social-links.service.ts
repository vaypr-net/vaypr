import axios from '../axios';

// ==================== TYPES ====================

export interface SocialLink {
  _id: string;
  platform: string;
  url: string;
  icon: string;
  enabled: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== DTOs ====================

export interface CreateSocialLinkDto {
  platform: string;
  url: string;
  icon: string;
  enabled?: boolean;
}

export interface UpdateSocialLinkDto extends Partial<CreateSocialLinkDto> {}

export interface ReorderSocialLinksDto {
  linkIds: string[];
}

// ==================== SERVICE ====================

const BASE_URL = '/super-admin/social-links';

export const SocialLinksService = {
  // ========== SOCIAL LINKS CRUD ==========

  async getAll(): Promise<SocialLink[]> {
    console.log('🔗 Fetching social links');
    const response = await axios.get<SocialLink[]>(BASE_URL);
    console.log('✅ Social links response:', response.data);
    return response.data;
  },

  async getById(id: string): Promise<SocialLink> {
    console.log('🔗 Fetching social link:', id);
    const response = await axios.get<SocialLink>(`${BASE_URL}/${id}`);
    console.log('✅ Social link response:', response.data);
    return response.data;
  },

  async create(data: CreateSocialLinkDto): Promise<SocialLink> {
    console.log('🔗 Creating social link:', data);
    const response = await axios.post<SocialLink>(BASE_URL, data);
    console.log('✅ Social link created:', response.data);
    return response.data;
  },

  async update(id: string, data: UpdateSocialLinkDto): Promise<SocialLink> {
    console.log('🔗 Updating social link:', id, data);
    const response = await axios.patch<SocialLink>(`${BASE_URL}/${id}`, data);
    console.log('✅ Social link updated:', response.data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    console.log('🔗 Deleting social link:', id);
    const response = await axios.delete<{ message: string }>(`${BASE_URL}/${id}`);
    console.log('✅ Social link deleted:', response.data);
    return response.data;
  },

  // ========== BULK OPERATIONS ==========

  async reorder(linkIds: string[]): Promise<SocialLink[]> {
    console.log('🔗 Reordering social links:', linkIds);
    const response = await axios.patch<SocialLink[]>(`${BASE_URL}/reorder`, { linkIds });
    console.log('✅ Social links reordered:', response.data);
    return response.data;
  },

  async toggleEnabled(id: string): Promise<SocialLink> {
    console.log('🔗 Toggling social link enabled:', id);
    const response = await axios.patch<SocialLink>(`${BASE_URL}/${id}/toggle`);
    console.log('✅ Social link toggled:', response.data);
    return response.data;
  },
};
