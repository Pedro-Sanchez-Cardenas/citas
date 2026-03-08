import api from '@/lib/api';

export async function fetchInventoryStocks(
  params: Record<string, unknown> = {}
): Promise<unknown[]> {
  const response = await api.get('/api/inventory/stocks', { params });
  const raw = response.data?.data ?? response.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export async function adjustInventory(payload: Record<string, unknown>): Promise<unknown> {
  const response = await api.post('/api/inventory/adjust', payload);
  return response.data?.data ?? response.data ?? null;
}
