import api from '@/lib/api';

export async function fetchDashboardCards() {
  const response = await api.get('/api/dashboard');
  return response.data?.cards || [];
}

