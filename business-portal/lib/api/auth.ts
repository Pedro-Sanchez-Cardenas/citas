import api from '@/lib/api';
import type { User } from '@/types';

export async function fetchCsrfCookie(): Promise<unknown> {
  return api.get('/sanctum/csrf-cookie');
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user?: User;
  [key: string]: unknown;
}

export async function loginRequest(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/api/login', credentials);
  return response.data;
}

export async function fetchCurrentUser(): Promise<User | null> {
  const response = await api.get<{ user?: User }>('/api/me');
  return response.data?.user ?? null;
}

export async function logoutRequest(): Promise<unknown> {
  return api.post('/api/logout');
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  [key: string]: unknown;
}

export async function updateProfileRequest(payload: UpdateProfilePayload): Promise<User> {
  const response = await api.patch<{ user?: User }>('/api/me', payload);
  return response.data?.user ?? (response.data as User);
}
