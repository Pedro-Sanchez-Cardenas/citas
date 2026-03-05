import api from '../api';

export async function fetchInventoryStocks(params = {}) {
  const response = await api.get('/api/inventory/stocks', { params });
  return response.data?.data ?? response.data ?? [];
}

export async function adjustInventory(payload) {
  const response = await api.post('/api/inventory/adjust', payload);
  return response.data?.data ?? response.data ?? null;
}

