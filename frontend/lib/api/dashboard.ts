import api from '@/lib/api';

export async function fetchDashboardCards(): Promise<unknown[]> {
  const response = await api.get('/api/dashboard');
  return response.data?.cards ?? [];
}
