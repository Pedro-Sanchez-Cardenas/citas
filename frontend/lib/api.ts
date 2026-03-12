import axios, { type AxiosInstance } from 'axios';

const baseURL =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_BASE_URL || ''
    : process.env.NEXT_PUBLIC_API_BASE_URL || '';

/** Base URL del API; útil para construir URLs de recursos (ej. fotos de cliente). */
export const apiBaseUrl = baseURL.replace(/\/$/, '');

/**
 * Origen del backend sin el prefijo /api. Las fotos se sirven desde /storage en la raíz
 * del servidor Laravel, no bajo /api, así que la URL de la imagen no debe llevar /api.
 */
const storageOrigin = apiBaseUrl.replace(/\/api\/?$/, '') || apiBaseUrl;

/**
 * URL del endpoint que sirve la foto del cliente (misma base que el API, con auth).
 * Usar esta URL en <img src> para que la petición vaya con cookies y funcione siempre.
 */
export function clientPhotoEndpointUrl(clientId: number | string): string {
  return `${apiBaseUrl}/clients/${clientId}/photo`;
}

/**
 * Devuelve la URL absoluta de una foto de cliente (ruta /storage/... o URL del endpoint).
 * Preferir clientPhotoEndpointUrl(id) cuando tengas el id del cliente.
 */
export function clientPhotoUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  return `${storageOrigin}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

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
