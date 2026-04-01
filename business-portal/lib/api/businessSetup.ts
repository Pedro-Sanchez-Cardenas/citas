import api from '@/lib/api';

const BASE_PATH = '/api/business-setup';

export async function fetchBusinessSetup(): Promise<unknown> {
  const response = await api.get(BASE_PATH);
  return response.data;
}

export interface UpdateBusinessBrandingPayload {
  primary_color?: string | null;
  public_booking_title?: string | null;
  public_booking_subtitle?: string | null;
  logo_file?: File | null;
  hero_image_file?: File | null;
}

export async function updateBusinessBranding(payload: UpdateBusinessBrandingPayload): Promise<unknown> {
  const form = new FormData();
  if (payload.primary_color !== undefined) form.append('primary_color', payload.primary_color ?? '');
  if (payload.public_booking_title !== undefined) form.append('public_booking_title', payload.public_booking_title ?? '');
  if (payload.public_booking_subtitle !== undefined) form.append('public_booking_subtitle', payload.public_booking_subtitle ?? '');
  if (payload.logo_file) form.append('logo_file', payload.logo_file);
  if (payload.hero_image_file) form.append('hero_image_file', payload.hero_image_file);

  const response = await api.post(`${BASE_PATH}/branding`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
