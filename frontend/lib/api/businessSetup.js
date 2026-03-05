import api from '../api';

const BASE_PATH = '/api/business-setup';

export async function fetchBusinessSetup() {
  const response = await api.get(BASE_PATH);
  return response.data;
}

