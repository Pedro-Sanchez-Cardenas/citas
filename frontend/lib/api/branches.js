import api from '../api';

const BASE_PATH = '/api/branches';

export async function fetchBranches(params = {}) {
  const response = await api.get(BASE_PATH, { params });
  const data = response.data;
  return data?.data ?? (Array.isArray(data) ? data : []);
}
