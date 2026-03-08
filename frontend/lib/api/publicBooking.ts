import api from '@/lib/api';

const BASE_PATH = '/api/public';

export async function fetchPublicServices(
  businessIdOrSlug: string,
  params: Record<string, unknown> = {}
): Promise<unknown[]> {
  const response = await api.get(`${BASE_PATH}/${businessIdOrSlug}/services`, { params });
  const raw = response.data?.data ?? response.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export async function fetchPublicProfessionals(
  businessIdOrSlug: string,
  params: Record<string, unknown> = {}
): Promise<unknown[]> {
  const response = await api.get(`${BASE_PATH}/${businessIdOrSlug}/professionals`, { params });
  const raw = response.data?.data ?? response.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export async function fetchPublicAvailability(
  businessIdOrSlug: string,
  params: Record<string, unknown> = {}
): Promise<unknown> {
  const response = await api.get(`${BASE_PATH}/${businessIdOrSlug}/availability`, { params });
  return response.data?.data ?? response.data ?? null;
}

export interface CreatePublicBookingPayload {
  branch_id: number;
  service_id: number;
  professional_id: number;
  date: string;
  time: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  [key: string]: unknown;
}

export async function createPublicBooking(
  businessIdOrSlug: string,
  payload: CreatePublicBookingPayload
): Promise<unknown> {
  const response = await api.post(`${BASE_PATH}/${businessIdOrSlug}/book`, payload);
  return response.data?.data ?? response.data ?? null;
}
