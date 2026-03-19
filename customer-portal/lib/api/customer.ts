import api from '@/lib/api';

const BASE_PATH = '/api/public';

export interface CustomerSession {
  account?: { id: number; email: string };
  client?: { id: number; name?: string };
}

export interface BookingCatalog {
  business?: {
    id?: number;
    name?: string;
    branding?: {
      logo_url?: string | null;
      hero_image_url?: string | null;
      primary_color?: string | null;
      public_booking_title?: string | null;
      public_booking_subtitle?: string | null;
    };
  };
  branches?: Array<{ id: number; name: string; services?: Array<{ id: number; name: string; duration_minutes?: number }> }>;
}

export async function fetchCsrfCookie(): Promise<void> {
  await api.get('/sanctum/csrf-cookie');
}

export async function fetchCatalog(slug: string): Promise<BookingCatalog> {
  const response = await api.get(`${BASE_PATH}/${slug}/services`);
  return response.data ?? {};
}

export async function fetchProfessionals(slug: string): Promise<Array<{ id: number; name: string; branch_id?: number }>> {
  const response = await api.get(`${BASE_PATH}/${slug}/professionals`);
  const data = response.data?.data ?? response.data ?? [];
  return Array.isArray(data) ? data : [];
}

export async function registerCustomer(
  slug: string,
  payload: { name: string; email: string; password: string; phone?: string }
): Promise<CustomerSession> {
  await fetchCsrfCookie();
  const response = await api.post(`${BASE_PATH}/${slug}/customer/register`, payload);
  return response.data ?? {};
}

export async function loginCustomer(
  slug: string,
  payload: { email: string; password: string }
): Promise<CustomerSession> {
  await fetchCsrfCookie();
  const response = await api.post(`${BASE_PATH}/${slug}/customer/login`, payload);
  return response.data ?? {};
}

export async function logoutCustomer(slug: string): Promise<void> {
  await api.post(`${BASE_PATH}/${slug}/customer/logout`);
}

export async function fetchCustomerMe(slug: string): Promise<CustomerSession | null> {
  try {
    const response = await api.get(`${BASE_PATH}/${slug}/customer/me`);
    return response.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchCustomerAppointments(slug: string): Promise<unknown[]> {
  const response = await api.get(`${BASE_PATH}/${slug}/customer/appointments`);
  const data = response.data?.data ?? response.data ?? [];
  return Array.isArray(data) ? data : [];
}

export async function createCustomerBooking(
  slug: string,
  payload: {
    branch_id: number;
    professional_id: number;
    service_id?: number | null;
    start_at: string;
    end_at: string;
  }
): Promise<unknown> {
  const response = await api.post(`${BASE_PATH}/${slug}/customer/book`, payload);
  return response.data?.data ?? response.data ?? null;
}
