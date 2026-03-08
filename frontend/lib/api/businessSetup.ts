import api from '@/lib/api';

const BASE_PATH = '/api/business-setup';

export async function fetchBusinessSetup(): Promise<unknown> {
  const response = await api.get(BASE_PATH);
  return response.data;
}
