import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchCombinedServices,
  createCombinedService,
  updateCombinedService,
  deleteCombinedService,
} from '@/lib/api/combinedServices';
import { fetchServices } from '@/lib/api/services';
import { extractFieldErrors, type FormFieldErrors } from '@/lib/formErrors';
import {
  Button,
  Table,
  FloatMenu,
  EmptyState,
  Alert,
  PageHeader,
  SearchBar,
  PageLoading,
} from '@/components/ui';
import {
  CombinedServiceFormModal,
  type CombinedServiceRecord,
  type CombinedFormPayload,
} from '@/components/services/combined';
import type { Service } from '@/types';
import type { AxiosError } from 'axios';
import { swalConfirm, swalError, swalSilentErrorText, swalSuccess } from '@/lib/swal';

export default function CombinedServicesPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [combined, setCombined] = useState<CombinedServiceRecord[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [selected, setSelected] = useState<CombinedServiceRecord | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const [combinedData, servicesData] = await Promise.all([
          fetchCombinedServices(),
          fetchServices(),
        ]);
        if (!cancelled) {
          setCombined(Array.isArray(combinedData) ? (combinedData as CombinedServiceRecord[]) : []);
          setServices(Array.isArray(servicesData) ? servicesData : []);
        }
      } catch (err) {
        if (!cancelled) {
          const ax = err as AxiosError<{ message?: string }>;
          setError(
            ax?.response?.data?.message ||
              'No se pudieron cargar los servicios combinados.'
          );
          if (ax?.response?.status === 401) logout();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [user, logout]);

  const filteredCombined = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return combined;
    return combined.filter((item) => {
      const name = String(item.name ?? '').toLowerCase();
      const code = String(item.code ?? '').toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [combined, search]);

  const isLoading = authLoading || loading;

  const openCreateModal = () => {
    setFieldErrors({});
    setSelected(null);
    setModalOpen(true);
  };

  const openEditModal = (item: CombinedServiceRecord) => {
    setFieldErrors({});
    setSelected(item);
    setModalOpen(true);
  };

  const handleSubmit = async (formData: CombinedFormPayload) => {
    setModalLoading(true);
    setError('');
    setFieldErrors({});
    try {
      if (selected?.id) {
        const updated = await updateCombinedService(
          selected.id,
          formData as unknown as Record<string, unknown>
        );
        setCombined((prev) =>
          prev.map((c) => (c.id === selected.id ? (updated as CombinedServiceRecord) ?? c : c))
        );
      } else {
        const created = await createCombinedService(
          formData as unknown as Record<string, unknown>
        );
        if (created) setCombined((prev) => [created as CombinedServiceRecord, ...prev]);
      }
      setModalOpen(false);
      setSelected(null);
      void swalSuccess('Guardado correcto', 'Los datos del combinado se guardaron correctamente.');
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      const msg = swalSilentErrorText(err);
      setError(msg);
      void swalError('Error al guardar', msg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await swalConfirm({
      title: 'Eliminar servicio combinado',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!ok) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteCombinedService(id);
      setCombined((prev) => prev.filter((c) => c.id !== id));
      void swalSuccess('Eliminado', 'El servicio combinado se eliminó correctamente.');
    } catch (err) {
      const msg = swalSilentErrorText(err);
      setError(msg);
      void swalError('Error al eliminar', msg);
    } finally {
      setDeletingId(null);
    }
  };

  if (!authLoading && !user) return null;

  return (
    <>
      <CombinedServiceFormModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setFieldErrors({});
            setModalOpen(false);
            setSelected(null);
          }
        }}
        onSubmit={handleSubmit}
        initialData={selected}
        loading={modalLoading}
        services={services}
        fieldErrors={fieldErrors}
      />

      <PageHeader
        title="Servicios combinados"
        subtitle="Paquetes de varios servicios para ofrecer experiencias completas."
        action={
          <Button type="button" onClick={openCreateModal} size="md">
            <span className="mr-2 text-base">+</span>
            Nuevo combinado
          </Button>
        }
      />

      <div className="page-filters" role="search" aria-label="Filtrar combinados">
        <SearchBar
          id="combined-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o código..."
          className="min-w-0 flex-1"
        />
        <p className="text-xs text-slate-500 tabular-nums sm:max-w-[12rem] sm:text-right">
          {search.trim()
            ? `${filteredCombined.length} de ${combined.length} combinados`
            : `${combined.length} combinado${combined.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {isLoading ? (
        <PageLoading label="Cargando servicios combinados..." />
      ) : filteredCombined.length === 0 ? (
        <EmptyState
          icon="💫"
          title={search.trim() ? 'No hay resultados' : 'Aún no hay combinados'}
          description={
            search.trim()
              ? 'Prueba con otro término de búsqueda.'
              : 'Combina varios servicios en un paquete para vender experiencias completas.'
          }
          action={
            !search.trim() ? (
              <Button type="button" variant="outline" size="sm" onClick={openCreateModal}>
                Crear primer combinado
              </Button>
            ) : null
          }
        />
      ) : (
        <Table<CombinedServiceRecord>
          columns={[
            { key: 'name', header: 'Nombre' },
            { key: 'code', header: 'Código' },
            { key: 'duration', header: 'Duración total' },
            { key: 'items', header: 'Servicios incluidos' },
            { key: 'status', header: 'Estado' },
            { key: 'actions', header: 'Acciones', align: 'right' },
          ]}
          items={filteredCombined}
          getItemKey={(item) => item.id}
          renderCell={(item, key) => {
            if (key === 'name') {
              return (
                <span className="text-sm font-medium text-slate-50">{item.name}</span>
              );
            }
            if (key === 'code') {
              return <span className="text-xs text-slate-400">{item.code}</span>;
            }
            if (key === 'duration') {
              return (
                <span className="text-xs text-slate-400">
                  {item.total_duration_minutes ? `${item.total_duration_minutes} min` : '—'}
                </span>
              );
            }
            if (key === 'items') {
              const servicesText =
                Array.isArray(item.items) && item.items.length > 0
                  ? item.items
                      .map((ci) => ci.service?.name ?? `Servicio #${ci.service_id}`)
                      .join(', ')
                  : '—';
              return (
                <span className="wrap-break-word text-xs text-slate-400">
                  {servicesText}
                </span>
              );
            }
            if (key === 'status') {
              return (
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
                    item.is_active
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                      : 'border border-white/[0.1] bg-white/[0.06] text-slate-300'
                  }`}
                >
                  <span
                    className={`mr-1 h-1.5 w-1.5 rounded-full ${
                      item.is_active ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                  {item.is_active ? 'Activo' : 'Inactivo'}
                </span>
              );
            }
            if (key === 'actions') {
              return (
                <div className="flex justify-end">
                  <FloatMenu
                    placement="bottom-end"
                    options={[
                      { label: 'Editar', onClick: () => openEditModal(item) },
                      { divider: true },
                      {
                        label: deletingId === item.id ? 'Eliminando...' : 'Eliminar',
                        onClick: () => handleDelete(item.id),
                        disabled: deletingId === item.id,
                      },
                    ]}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-slate-200"
                      aria-label="Acciones"
                    >
                      ⋮
                    </Button>
                  </FloatMenu>
                </div>
              );
            }
            return null;
          }}
        />
      )}
    </>
  );
}
