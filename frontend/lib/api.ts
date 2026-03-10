import axios, { type AxiosInstance } from 'axios';

const baseURL =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_BASE_URL || ''
    : process.env.NEXT_PUBLIC_API_BASE_URL || '';

const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

let onUnauthorized: () => void = () => {};

export function setUnauthorizedHandler(handler: (() => void) | undefined): void {
  onUnauthorized = typeof handler === 'function' ? handler : () => {};
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const part = parts.pop()?.split(';').shift();
    return part ? decodeURIComponent(part) : null;
  }
  return null;
}

api.interceptors.request.use((config) => {
  const token = getCookie('XSRF-TOKEN');
  if (token) {
    config.headers['X-XSRF-TOKEN'] = token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default api;
