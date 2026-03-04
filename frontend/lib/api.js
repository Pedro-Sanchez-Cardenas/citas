import axios from 'axios';

const baseURL =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_BASE_URL || ''
    : process.env.NEXT_PUBLIC_API_BASE_URL || '';

const api = axios.create({
  baseURL,
  withCredentials: true,
});

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
  return null;
}

api.interceptors.request.use((config) => {
  const token = getCookie('XSRF-TOKEN');
  if (token) {
    config.headers['X-XSRF-TOKEN'] = token;
  }
  return config;
});

export default api;
