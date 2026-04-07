import axios from '../axios';

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupData {
  fullName: string;
  email: string;
  password: string;
}

interface ForgotPasswordData {
  email: string;
}

interface ResetPasswordData {
  token: string;
  newPassword: string;
}

interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    isSuperAdmin?: boolean;  // ✅ ADDED
  };
}

interface UserResponse {
  _id: string;
  fullName: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export const AuthService = {
  async login(credentials: LoginCredentials): Promise<any> {
    const response = await axios.post('/auth/login', credentials);
    return response.data;
  },

  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>('/user/register', data);
    return response.data;
  },

  async getProfile(userId: string): Promise<UserResponse> {
    const response = await axios.get<UserResponse>(`/user/${userId}`);
    return response.data;
  },

  async forgotPassword(data: ForgotPasswordData): Promise<{ message: string }> {
    const response = await axios.post<{ message: string }>('/auth/forgot-password', data);
    return response.data;
  },

  async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    const response = await axios.post<{ message: string }>('/auth/reset-password', data);
    return response.data;
  },

  /** Trigger super admin password reset — no email body needed. */
  async superAdminForgotPassword(): Promise<{ message: string }> {
    const response = await axios.post<{ message: string }>('/auth/super-admin/forgot-password');
    return response.data;
  },

  /** Complete super admin password reset with token from email. */
  async superAdminResetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    const response = await axios.post<{ message: string }>('/auth/super-admin/reset-password', data);
    return response.data;
  },

  async updateProfile(userId: string, data: Partial<SignupData>): Promise<UserResponse> {
    const response = await axios.patch<UserResponse>(`/user/${userId}`, data);
    return response.data;
  },
};
