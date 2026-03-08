import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAgendaDay, fetchAgendaWeek } from '@/lib/api/agenda';
import { Button, Input, Select, Checkbox, Table, DatePicker } from '@/components/ui';

function formatHour(value) {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value.slice(11, 16);
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return value;
  }
}

export default function AgendaPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [view, setView] = useState('day'); // 'day' | 'week'
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCancelled, setShowCancelled] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadAgenda() {
      setLoading(true);
      setError('');
      try {
        const params = { date };
        const response =
          view === 'day'
            ? await fetchAgendaDay(params)
            : await fetchAgendaWeek(params);
        if (!cancelled) {
          setData(response ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              'No se pudo cargar la agenda.'
          );
          if (err?.response?.status === 401) {
            logout();
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAgenda();

    return () => {
      cancelled = true;
    };
  }, [user, logout, view, date]);

  const agendaItems = useMemo(() => {
    if (!data) return [];
    const items = Array.isArray(data.items ?? data) ? data.items ?? data : [];
    if (!showCancelled) {
      return items.filter(
        (item) => item.status !== 'cancelled' && item.status !== 'no_show'
      );
    }
    return items;
  }, [data, showCancelled]);

  if (!authLoading && !user) {
    return null;
  }

  const isLoading = authLoading || loading;

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Agenda
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Visualiza las citas del día o de toda la semana para tu equipo.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="inline-flex rounded-2xl border border-slate-800/80 bg-slate-950/70 p-1 text-xs">
            <button
              type="button"
              onClick={() => setView('day')}
              className={`flex-1 rounded-xl px-3 py-1.5 ${
                view === 'day'
                  ? 'bg-slate-900 text-slate-50 shadow-[0_0_0_1px_rgba(148,163,184,0.6)]'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              Día
            </button>
            <button
              type="button"
              onClick={() => setView('week')}
              className={`flex-1 rounded-xl px-3 py-1.5 ${
                view === 'week'
                  ? 'bg-slate-900 text-slate-50 shadow-[0_0_0_1px_rgba(148,163,184,0.6)]'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              Semana
            </button>
          </div>
          <DatePicker
            label={null}
            id="agenda-date"
            value={date || null}
            onChange={(_, dateStr) => setDate(dateStr || '')}
            inputClassName="rounded-2xl border-slate-800/80 bg-slate-950/70"
          />
        </div>
      </header>

      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-[11px] text-slate-500">
          {agendaItems.length} cita
          {agendaItems.length === 1 ? '' : 's'} en esta vista
        </div>
        <Checkbox
          checked={showCancelled}
          onChange={(e) => setShowCancelled(e.target.checked)}
          label="Mostrar canceladas / no presentados"
        />
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.25)]">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="mt-10 flex items-center justify-center text-sm text-slate-400">
          Cargando agenda...
        </div>
      ) : agendaItems.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/60 px-6 py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-xl">
            🗓
          </div>
          <h3 className="text-sm font-medium text-slate-100">
            No hay citas en la agenda
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            Cambia el día o la vista de semana, o crea nuevas citas desde el módulo de Citas.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 bg-slate-100 text-slate-900 hover:bg-slate-200 border-transparent"
            onClick={() => router.push('/appointments')}
          >
            Ir al módulo de Citas
          </Button>
        </div>
      ) : view === 'day' ? (
        <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agendaItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.85)]"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-xs font-medium text-slate-400">
                  {item.professional_name}
                </div>
                <div className="text-[11px] text-slate-500">
                  {formatHour(item.start_at)} - {formatHour(item.end_at)}
                </div>
              </div>
              <div className="text-sm font-semibold text-slate-50">
                {item.client_name}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {item.service_name || 'Sin servicio asignado'}
              </div>
              {item.status && (
                <div className="mt-2 text-[11px]">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 ${
                      item.status === 'cancelled' || item.status === 'no_show'
                        ? 'bg-red-500/15 text-red-200 border border-red-500/40'
                        : item.status === 'attended'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                        : item.status === 'confirmed'
                        ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40'
                        : 'bg-slate-800/80 text-slate-300 border border-slate-700/80'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Table
          columns={[
            { key: 'professional', header: 'Profesional' },
            { key: 'day', header: 'Día' },
            { key: 'time', header: 'Hora' },
            { key: 'client', header: 'Cliente' },
            { key: 'service', header: 'Servicio' },
            { key: 'status', header: 'Estado' },
          ]}
          items={agendaItems}
          getItemKey={(item) => item.id}
          renderCell={(item, key) => {
            if (key === 'professional') {
              return (
                <span className="text-xs text-slate-200">
                  {item.professional_name}
                </span>
              );
            }

            if (key === 'day') {
              return (
                <span className="text-xs text-slate-400">
                  {item.day_label || item.date}
                </span>
              );
            }

            if (key === 'time') {
              return (
                <span className="text-xs text-slate-400">
                  {formatHour(item.start_at)} - {formatHour(item.end_at)}
                </span>
              );
            }

            if (key === 'client') {
              return (
                <span className="text-xs text-slate-200">
                  {item.client_name}
                </span>
              );
            }

            if (key === 'service') {
              return (
                <span className="text-xs text-slate-400">
                  {item.service_name || '—'}
                </span>
              );
            }

            if (key === 'status') {
              return (
                <span className="text-xs text-slate-400">
                  {item.status || '—'}
                </span>
              );
            }

            return null;
          }}
        />
      )}
    </DashboardLayout>
  );
}

