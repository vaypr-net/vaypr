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

interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
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
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>('/auth/login', credentials);
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

  async updateProfile(userId: string, data: Partial<SignupData>): Promise<UserResponse> {
    const response = await axios.patch<UserResponse>(`/user/${userId}`, data);
    return response.data;
  },
};
