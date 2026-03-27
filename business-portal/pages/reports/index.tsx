import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchBusinessSummaryReport,
  fetchProfessionalsReport,
  fetchServicesReport,
} from '@/lib/api/reports';
import { Select, Table, PageHeader, Alert, PageLoading } from '@/components/ui';
import type { BusinessSummary, ReportRow } from '@/components/reports/types';
import type { AxiosError } from 'axios';

export default function ReportsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'business' | 'professionals' | 'services'>('business');
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [businessSummary, setBusinessSummary] = useState<BusinessSummary | null>(null);
  const [professionalsReport, setProfessionalsReport] = useState<ReportRow[] | null>(null);
  const [servicesReport, setServicesReport] = useState<ReportRow[] | null>(null);

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
          setBusinessSummary(business as BusinessSummary);
          setProfessionalsReport(Array.isArray(pros) ? (pros as ReportRow[]) : null);
          setServicesReport(Array.isArray(services) ? (services as ReportRow[]) : null);
        }
      } catch (err) {
        if (!cancelled) {
          const ax = err as AxiosError<{ message?: string }>;
          setError(
            ax?.response?.data?.message || 'No se pudieron cargar los reportes.'
          );
          if (ax?.response?.status === 401) logout();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadReports();
    return () => { cancelled = true; };
  }, [user, logout, period]);

  if (!authLoading && !user) return null;

  const isLoading = authLoading || loading;

  return (
    <>
      <PageHeader
        title="Reportes"
        subtitle="Compara ingresos, citas y equipo con los periodos que elijas."
      />

      <div className="surface-inset mb-6 flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div
          className="inline-flex rounded-2xl border border-white/[0.08] bg-slate-950/50 p-1 text-xs font-medium"
          role="tablist"
          aria-label="Tipo de reporte"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'business'}
            onClick={() => setActiveTab('business')}
            className={`rounded-xl px-3 py-2 transition-colors ${
              activeTab === 'business'
                ? 'bg-teal-500/20 text-teal-100 ring-1 ring-teal-400/35'
                : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
            }`}
          >
            Negocio
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'professionals'}
            onClick={() => setActiveTab('professionals')}
            className={`rounded-xl px-3 py-2 transition-colors ${
              activeTab === 'professionals'
                ? 'bg-teal-500/20 text-teal-100 ring-1 ring-teal-400/35'
                : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
            }`}
          >
            Profesionales
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'services'}
            onClick={() => setActiveTab('services')}
            className={`rounded-xl px-3 py-2 transition-colors ${
              activeTab === 'services'
                ? 'bg-teal-500/20 text-teal-100 ring-1 ring-teal-400/35'
                : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
            }`}
          >
            Servicios
          </button>
        </div>
        <Select
          label="Periodo"
          id="reports-period"
          value={period}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setPeriod(e.target.value)}
          className="w-full sm:w-56"
        >
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
          <option value="90">Últimos 90 días</option>
        </Select>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {isLoading ? (
        <PageLoading label="Generando reportes..." />
      ) : activeTab === 'business' ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="Resumen del negocio">
          <div className="surface-panel p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Ingresos
            </div>
            <div className="mt-3 text-2xl font-semibold tabular-nums text-slate-50">
              {businessSummary?.total_revenue_formatted ?? '—'}
            </div>
          </div>
          <div className="surface-panel p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Citas atendidas
            </div>
            <div className="mt-3 text-2xl font-semibold tabular-nums text-slate-50">
              {businessSummary?.appointments_attended ?? '—'}
            </div>
          </div>
          <div className="surface-panel p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Nuevos clientes
            </div>
            <div className="mt-3 text-2xl font-semibold tabular-nums text-slate-50">
              {businessSummary?.new_clients ?? '—'}
            </div>
          </div>
        </section>
      ) : activeTab === 'professionals' ? (
        <section className="mt-2">
          <Table<ReportRow>
            columns={[
              { key: 'name', header: 'Profesional' },
              { key: 'appointments', header: 'Citas' },
              { key: 'revenue', header: 'Ingresos' },
              { key: 'ticket', header: 'Ticket promedio' },
            ]}
            items={Array.isArray(professionalsReport) ? professionalsReport : []}
            getItemKey={(row) => row.id}
            renderCell={(row, key) => {
              if (key === 'name') {
                return (
                  <span className="text-sm font-medium text-slate-50">{row.name}</span>
                );
              }
              if (key === 'appointments') {
                return (
                  <span className="text-xs text-slate-400">
                    {row.appointments_count ?? '—'}
                  </span>
                );
              }
              if (key === 'revenue') {
                return (
                  <span className="text-xs text-slate-400">
                    {row.revenue_formatted ?? '—'}
                  </span>
                );
              }
              if (key === 'ticket') {
                return (
                  <span className="text-xs text-slate-400">
                    {row.average_ticket_formatted ?? '—'}
                  </span>
                );
              }
              return null;
            }}
          />
        </section>
      ) : (
        <section className="mt-2">
          <Table<ReportRow>
            columns={[
              { key: 'name', header: 'Servicio' },
              { key: 'appointments', header: 'Citas' },
              { key: 'revenue', header: 'Ingresos' },
            ]}
            items={Array.isArray(servicesReport) ? servicesReport : []}
            getItemKey={(row) => row.id}
            renderCell={(row, key) => {
              if (key === 'name') {
                return (
                  <span className="text-sm font-medium text-slate-50">{row.name}</span>
                );
              }
              if (key === 'appointments') {
                return (
                  <span className="text-xs text-slate-400">
                    {row.appointments_count ?? '—'}
                  </span>
                );
              }
              if (key === 'revenue') {
                return (
                  <span className="text-xs text-slate-400">
                    {row.revenue_formatted ?? '—'}
                  </span>
                );
              }
              return null;
            }}
          />
        </section>
      )}
    </>
  );
}
