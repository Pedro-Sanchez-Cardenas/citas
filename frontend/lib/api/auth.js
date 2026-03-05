import api from '../api';

export async function fetchCsrfCookie() {
  return api.get('/sanctum/csrf-cookie');
}

export async function loginRequest(credentials) {
  const response = await api.post('/api/login', credentials);
  return response.data;
}

export async function fetchCurrentUser() {
  const response = await api.get('/api/me');
  return response.data?.user ?? null;
}

export async function logoutRequest() {
  return api.post('/api/logout');
}

