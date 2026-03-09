import api from '@/lib/api';

const BASE_PATH = '/api/agenda';

export async function fetchAgendaDay(params: Record<string, unknown> = {}): Promise<unknown> {
  const response = await api.get(`${BASE_PATH}/day`, { params });
  return response.data?.data ?? response.data ?? null;
}

export async function fetchAgendaWeek(params: Record<string, unknown> = {}): Promise<unknown> {
  const response = await api.get(`${BASE_PATH}/week`, { params });
  return response.data?.data ?? response.data ?? null;
}

/** Devuelve items de agenda para un rango de fechas (varias semanas si hace falta). */
export async function fetchAgendaRange(
  start: Date,
  end: Date,
  params: { branch_id?: number; professional_id?: number } = {}
): Promise<{ items?: unknown[] }> {
  const oneDay = 24 * 60 * 60 * 1000;
  const startTime = new Date(start).setHours(0, 0, 0, 0);
  const endTime = end.getTime();
  const daysDiff = Math.ceil((endTime - startTime) / oneDay);

  const d = new Date(startTime);
  const weekStarts = new Set<string>();

  for (let i = 0; i <= daysDiff; i++) {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + i);
    const Monday = new Date(copy);
    const day = Monday.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    Monday.setDate(Monday.getDate() + diff);
    weekStarts.add(Monday.toISOString().slice(0, 10));
  }

  const results = await Promise.all(
    Array.from(weekStarts).map(async (dateStr) => {
      try {
        const data = await fetchAgendaWeek({ date: dateStr, ...params });
        const items = Array.isArray((data as { items?: unknown[] })?.items)
          ? (data as { items: unknown[] }).items
          : Array.isArray(data)
            ? data
            : [];
        return items as { id?: number }[];
      } catch {
        return [];
      }
    })
  );

  const seen = new Set<number>();
  const out: unknown[] = [];
  results.flat().forEach((item) => {
    if (item?.id != null && !seen.has(item.id)) {
      seen.add(item.id);
      out.push(item);
    }
  });

  return { items: out };
}
