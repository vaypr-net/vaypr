import axios from '../axios';

export interface SuperadminSettings {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  notifyNewSubscribers: boolean;
  notifyPaymentAlerts: boolean;
  notifySupportTickets: boolean;
  twoFactorEnabled: boolean;
}

export interface UpsertSuperadminSettingsDto {
  firstName: string;
  lastName: string;
  email: string;
  notifyNewSubscribers?: boolean;
  notifyPaymentAlerts?: boolean;
  notifySupportTickets?: boolean;
  twoFactorEnabled?: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const BASE_URL = '/superadmin-settings';

export const SuperadminSettingsService = {
  async getSettings(): Promise<SuperadminSettings> {
    const response = await axios.get<SuperadminSettings>(BASE_URL);
    return response.data;
  },

  async createSettings(data: UpsertSuperadminSettingsDto): Promise<SuperadminSettings> {
    const response = await axios.post<SuperadminSettings>(BASE_URL, data);
    return response.data;
  },

  async updateSettings(data: Partial<UpsertSuperadminSettingsDto>): Promise<SuperadminSettings> {
    const response = await axios.patch<SuperadminSettings>(BASE_URL, data);
    return response.data;
  },

  async changePassword(data: ChangePasswordDto): Promise<{ message: string }> {
    const response = await axios.patch<{ message: string }>(`${BASE_URL}/change-password`, data);
    return response.data;
  },
};
