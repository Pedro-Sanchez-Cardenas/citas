import api from '@/lib/api';

const BASE_PATH = '/api/business-setup';

export async function fetchBusinessSetup(): Promise<unknown> {
  const response = await api.get(BASE_PATH);
  return response.data;
}

export interface UpdateBusinessBrandingPayload {
  logo_url?: string | null;
  hero_image_url?: string | null;
  primary_color?: string | null;
  public_booking_title?: string | null;
  public_booking_subtitle?: string | null;
}

export async function updateBusinessBranding(payload: UpdateBusinessBrandingPayload): Promise<unknown> {
  const response = await api.patch(`${BASE_PATH}/branding`, payload);
  return response.data;
}
