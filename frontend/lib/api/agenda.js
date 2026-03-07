import api from '@/lib/api';

const BASE_PATH = '/api/agenda';

export async function fetchAgendaDay(params = {}) {
  const response = await api.get(`${BASE_PATH}/day`, { params });
  return response.data?.data ?? response.data ?? null;
}

export async function fetchAgendaWeek(params = {}) {
  const response = await api.get(`${BASE_PATH}/week`, { params });
  return response.data?.data ?? response.data ?? null;
}

