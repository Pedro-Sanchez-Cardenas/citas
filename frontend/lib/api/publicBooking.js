import api from '../api';

const BASE_PATH = '/api/public';

export async function fetchPublicServices(businessIdOrSlug, params = {}) {
  const response = await api.get(
    `${BASE_PATH}/${businessIdOrSlug}/services`,
    { params }
  );
  return response.data?.data ?? response.data ?? [];
}

export async function fetchPublicAvailability(businessIdOrSlug, params = {}) {
  const response = await api.get(
    `${BASE_PATH}/${businessIdOrSlug}/availability`,
    { params }
  );
  return response.data?.data ?? response.data ?? null;
}

export async function createPublicBooking(businessIdOrSlug, payload) {
  const response = await api.post(
    `${BASE_PATH}/${businessIdOrSlug}/book`,
    payload
  );
  return response.data?.data ?? response.data ?? null;
}

