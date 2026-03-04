import axios from '@/api/axios';

export interface EmailSettings {
  id: string;
  ownerId: string;
  supportInboxEmail: string;
  supportInboxName?: string;
  defaultSenderId?: string | null;
  defaultReplyToEmail?: string | null;
  defaultReplyToName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateEmailSettingsPayload {
  supportInboxEmail?: string;
  supportInboxName?: string;
  defaultSenderId?: string | null;
  defaultReplyToEmail?: string | null;
  defaultReplyToName?: string | null;
}

export interface UserSender {
  id: string;
  _id?: string;
  email: string;
  displayName: string;
  provider: 'brevo' | 'gmail';
  replyToEmail?: string;
  replyToName?: string;
  verified: boolean;
  status: 'active' | 'inactive';
  priority: 1 | 2 | null;
  createdAt: Date;
  isPrimary?: boolean;
  isSecondary?: boolean;
}

export interface CreateSenderPayload {
  email: string;
  displayName: string;
  provider?: 'gmail' | 'brevo';
  replyToEmail?: string;
  replyToName?: string;
}

export interface UpdateSenderPayload {
  displayName?: string;
  replyToEmail?: string;
  replyToName?: string;
}

export const emailSettingsService = {
  /**
   * Get current user's email settings
   */
  async getSettings(): Promise<EmailSettings> {
    const response = await axios.get('/settings/email');
    return response.data;
  },

  /**
   * Update email settings
   */
  async updateSettings(payload: UpdateEmailSettingsPayload): Promise<EmailSettings> {
    const response = await axios.patch('/settings/email', payload);
    return response.data;
  },

  /**
   * Get list of user's senders
   */
  async getSenders(): Promise<UserSender[]> {
    const response = await axios.get('/senders');
    return response.data;
  },

  /**
   * Create a new sender
   */
  async createSender(payload: CreateSenderPayload): Promise<UserSender> {
    const response = await axios.post('/senders', payload);
    return response.data;
  },

  /**
   * Update sender details
   */
  async updateSender(senderId: string, payload: UpdateSenderPayload): Promise<UserSender> {
    const response = await axios.patch(`/senders/${senderId}`, payload);
    return response.data;
  },

  /**
   * Set sender as primary
   */
  async setPrimary(senderId: string): Promise<UserSender> {
    const response = await axios.post(`/senders/${senderId}/set-primary`);
    return response.data;
  },

  /**
   * Set sender as secondary
   */
  async setSecondary(senderId: string): Promise<UserSender> {
    const response = await axios.post(`/senders/${senderId}/set-secondary`);
    return response.data;
  },

  /**
   * Remove/deactivate sender
   */
  async deleteSender(senderId: string): Promise<UserSender> {
    const response = await axios.delete(`/senders/${senderId}`);
    return response.data;
  },
};
