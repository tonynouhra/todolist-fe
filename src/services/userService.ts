import { AxiosInstance } from 'axios';

export interface UserProfile {
  id: string;
  clerk_user_id: string;
  email: string;
  username?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserProfileRequest {
  username?: string;
  email?: string;
}

export interface LoginRequest {
  token: string;
}

export interface SignupRequest {
  clerk_user_id: string;
  email: string;
  username?: string;
}

export interface AuthResponse {
  user: UserProfile;
  message: string;
}

export class UserService {
  constructor(private readonly apiClient: AxiosInstance) {}

  async login(loginData: LoginRequest): Promise<AuthResponse> {
    const response = await this.apiClient.post<AuthResponse>(
      '/api/auth/login',
      loginData
    );
    return response.data;
  }

  async signup(signupData: SignupRequest): Promise<AuthResponse> {
    const response = await this.apiClient.post<AuthResponse>(
      '/api/auth/signup',
      signupData
    );
    return response.data;
  }

  async logout(): Promise<{ message: string }> {
    const response = await this.apiClient.post<{ message: string }>(
      '/api/auth/logout'
    );
    return response.data;
  }

  async getCurrentUser(): Promise<UserProfile> {
    const response = await this.apiClient.get<UserProfile>('/api/auth/me');
    return response.data;
  }

  async updateProfile(updates: UpdateUserProfileRequest): Promise<UserProfile> {
    const response = await this.apiClient.put<UserProfile>(
      '/api/auth/me',
      updates
    );
    return response.data;
  }
}
