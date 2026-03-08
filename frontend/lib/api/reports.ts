import api from '@/lib/api';

const BASE_PATH = '/api/reports';

export async function fetchBusinessSummaryReport(
  params: Record<string, unknown> = {}
): Promise<unknown> {
  const response = await api.get(`${BASE_PATH}/business-summary`, { params });
  return response.data?.data ?? response.data ?? null;
}

export async function fetchProfessionalsReport(
  params: Record<string, unknown> = {}
): Promise<unknown> {
  const response = await api.get(`${BASE_PATH}/professionals`, { params });
  return response.data?.data ?? response.data ?? null;
}

export async function fetchServicesReport(
  params: Record<string, unknown> = {}
): Promise<unknown> {
  const response = await api.get(`${BASE_PATH}/services`, { params });
  return response.data?.data ?? response.data ?? null;
}
