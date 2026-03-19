import api from '@/lib/api';

const BASE_PATH = '/api/public';

export interface PublicBookingBusinessInfo {
  id: number;
  name: string;
  slug: string;
  branding?: {
    logo_url?: string | null;
    hero_image_url?: string | null;
    primary_color?: string | null;
    public_booking_title?: string | null;
    public_booking_subtitle?: string | null;
  };
}

export interface PublicServicesCatalogResponse {
  business?: PublicBookingBusinessInfo;
  branches?: unknown[];
}

export async function fetchPublicServices(
  businessIdOrSlug: string,
  params: Record<string, unknown> = {}
): Promise<PublicServicesCatalogResponse> {
  const response = await api.get(`${BASE_PATH}/${businessIdOrSlug}/services`, { params });
  const payload = response.data?.data ?? response.data ?? {};
  if (Array.isArray(payload)) {
    return { branches: payload };
  }
  return {
    business: payload?.business,
    branches: Array.isArray(payload?.branches) ? payload.branches : [],
  };
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
