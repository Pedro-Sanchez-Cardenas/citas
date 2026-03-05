import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchBusinessSummaryReport,
  fetchProfessionalsReport,
  fetchServicesReport,
} from '@/lib/api/reports';
import { Button, Select } from '@/components/ui';

export default function ReportsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('business');
  const [period, setPeriod] = useState('30'); // días
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [businessSummary, setBusinessSummary] = useState(null);
  const [professionalsReport, setProfessionalsReport] = useState(null);
  const [servicesReport, setServicesReport] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadReports() {
      setLoading(true);
      setError('');
      try {
        const params = { days: Number(period) };
        const [business, pros, services] = await Promise.all([
          fetchBusinessSummaryReport(params),
          fetchProfessionalsReport(params),
          fetchServicesReport(params),
        ]);
        if (!cancelled) {
          setBusinessSummary(business);
          setProfessionalsReport(pros);
          setServicesReport(services);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              'No se pudieron cargar los reportes.'
          );
          if (err?.response?.status === 401) {
            logout();
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadReports();

    return () => {
      cancelled = true;
    };
  }, [user, logout, period]);

  if (!authLoading && !user) {
    return null;
  }

  const isLoading = authLoading || loading;

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Reportes
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Revisa el rendimiento de tu negocio, de tu equipo y de tus servicios.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="inline-flex rounded-2xl border border-slate-800/80 bg-slate-950/70 p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('business')}
              className={`flex-1 rounded-xl px-3 py-1.5 ${
                activeTab === 'business'
                  ? 'bg-slate-900 text-slate-50 shadow-[0_0_0_1px_rgba(148,163,184,0.6)]'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              Negocio
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('professionals')}
              className={`flex-1 rounded-xl px-3 py-1.5 ${
                activeTab === 'professionals'
                  ? 'bg-slate-900 text-slate-50 shadow-[0_0_0_1px_rgba(148,163,184,0.6)]'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              Profesionales
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`flex-1 rounded-xl px-3 py-1.5 ${
                activeTab === 'services'
                  ? 'bg-slate-900 text-slate-50 shadow-[0_0_0_1px_rgba(148,163,184,0.6)]'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              Servicios
            </button>
          </div>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
          </Select>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.25)]">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="mt-10 flex items-center justify-center text-sm text-slate-400">
          Cargando reportes...
        </div>
      ) : activeTab === 'business' ? (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.85)]">
            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
              Ingresos
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-50">
              {businessSummary?.total_revenue_formatted ?? '—'}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.85)]">
            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
              Citas atendidas
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-50">
              {businessSummary?.appointments_attended ?? '—'}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.85)]">
            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
              Nuevos clientes
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-50">
              {businessSummary?.new_clients ?? '—'}
            </div>
          </div>
        </section>
      ) : activeTab === 'professionals' ? (
        <section className="mt-2 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.85)]">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Profesional</th>
                <th className="px-4 py-3 font-medium">Citas</th>
                <th className="px-4 py-3 font-medium">Ingresos</th>
                <th className="px-4 py-3 font-medium">Ticket promedio</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(professionalsReport) &&
                professionalsReport.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-slate-800/80 hover:bg-slate-900/70"
                  >
                    <td className="px-4 py-3 align-top text-sm font-medium text-slate-50">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-400">
                      {row.appointments_count ?? '—'}
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-400">
                      {row.revenue_formatted ?? '—'}
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-400">
                      {row.average_ticket_formatted ?? '—'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="mt-2 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.85)]">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Servicio</th>
                <th className="px-4 py-3 font-medium">Citas</th>
                <th className="px-4 py-3 font-medium">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(servicesReport) &&
                servicesReport.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-slate-800/80 hover:bg-slate-900/70"
                  >
                    <td className="px-4 py-3 align-top text-sm font-medium text-slate-50">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-400">
                      {row.appointments_count ?? '—'}
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-400">
                      {row.revenue_formatted ?? '—'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      )}
    </DashboardLayout>
  );
}

