import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchServices,
  createService,
  updateService,
  deleteService,
} from '@/lib/api/services';
import { fetchServiceCategories } from '@/lib/api/serviceCategories';
import { extractFieldErrors, type FormFieldErrors } from '@/lib/formErrors';
import { Button, Input, Table, FloatMenu, EmptyState, Alert, PageHeader } from '@/components/ui';
import {
  ServiceFormModal,
  formatPriceFromCents,
  type ServiceFormPayload,
  type ServiceWithCategory,
  type ServiceCategory,
} from '@/components/services';
import type { AxiosError } from 'axios';

export default function ServicesPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [services, setServices] = useState<ServiceWithCategory[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [selectedService, setSelectedService] = useState<ServiceWithCategory | null>(null);
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
        const [servicesData, categoriesData] = await Promise.all([
          fetchServices(),
          fetchServiceCategories(),
        ]);
        if (!cancelled) {
          setServices(Array.isArray(servicesData) ? (servicesData as ServiceWithCategory[]) : []);
          setCategories(Array.isArray(categoriesData) ? (categoriesData as ServiceCategory[]) : []);
        }
      } catch (err) {
        if (!cancelled) {
          const ax = err as AxiosError<{ message?: string }>;
          setError(
            ax?.response?.data?.message ||
              'No se pudieron cargar los servicios.'
          );
          if (ax?.response?.status === 401) {
            logout();
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [user, logout]);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter((service) => {
      const name = String(service.name ?? '').toLowerCase();
      const code = String(service.code ?? '').toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [services, search]);

  const categoryById = useMemo(() => {
    const map = new Map<number, ServiceCategory>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const isLoading = authLoading || loading;

  const openCreateModal = () => {
    setFieldErrors({});
    setSelectedService(null);
    setModalOpen(true);
  };

  const openEditModal = (service: ServiceWithCategory) => {
    setFieldErrors({});
    setSelectedService(service);
    setModalOpen(true);
  };

  const handleSubmitService = async (formData: ServiceFormPayload) => {
    setModalLoading(true);
    setError('');
    setFieldErrors({});
    try {
      if (selectedService?.id) {
        const updated = await updateService(selectedService.id, formData);
        setServices((prev) =>
          prev.map((s) => (s.id === selectedService.id ? (updated as ServiceWithCategory) ?? s : s))
        );
      } else {
        const created = await createService(formData);
        if (created) setServices((prev) => [created as ServiceWithCategory, ...prev]);
      }
      setModalOpen(false);
      setSelectedService(null);
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
          'No se pudo guardar el servicio. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!window.confirm('¿Eliminar este servicio? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeletingId(id);
    setError('');
    try {
      await deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
          'No se pudo eliminar el servicio. Inténtalo nuevamente.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (!authLoading && !user) {
    return null;
  }

  return (
    <>
      <ServiceFormModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setFieldErrors({});
            setModalOpen(false);
            setSelectedService(null);
          }
        }}
        onSubmit={handleSubmitService}
        initialData={selectedService}
        loading={modalLoading}
        categories={categories}
        fieldErrors={fieldErrors}
      />

      <PageHeader
        title="Servicios"
        subtitle="Catálogo de servicios: duración, precio y categoría para agendar citas."
        action={
          <Button type="button" onClick={openCreateModal} size="md">
            <span className="mr-2 text-base">+</span>
            Nuevo servicio
          </Button>
        }
      />

      <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Filtrar servicios">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Input
              type="text"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o código..."
              inputClassName="pl-10 rounded-xl border-slate-700/80 bg-slate-950/50"
            />
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500" aria-hidden>🔍</span>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          {search.trim()
            ? `${filteredServices.length} de ${services.length} servicios`
            : `${services.length} servicio${services.length === 1 ? '' : 's'}`}
        </p>
      </section>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/30">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500/50 border-t-teal-400" />
            <span className="text-sm">Cargando servicios...</span>
          </div>
        </div>
      ) : filteredServices.length === 0 ? (
        <EmptyState
          icon="✂️"
          title={search.trim() ? 'No hay resultados' : 'Aún no hay servicios'}
          description={
            search.trim()
              ? 'Prueba con otro término de búsqueda.'
              : 'Crea servicios para agendar citas con precios y duración claros.'
          }
          action={
            !search.trim() ? (
              <Button type="button" variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800" onClick={openCreateModal}>
                Crear primer servicio
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/40">
        <Table<ServiceWithCategory>
          columns={[
            { key: 'name', header: 'Nombre' },
            { key: 'code', header: 'Código' },
            { key: 'duration', header: 'Duración' },
            { key: 'price', header: 'Precio' },
            { key: 'category', header: 'Categoría' },
            { key: 'status', header: 'Estado' },
            { key: 'actions', header: 'Acciones', align: 'right' },
          ]}
          items={filteredServices}
          getItemKey={(service) => service.id}
          renderCell={(service, key) => {
            const category =
              service.service_category ??
              categoryById.get(service.service_category_id ?? 0);

            if (key === 'name') {
              return (
                <span className="text-sm font-medium text-slate-50">
                  {service.name}
                </span>
              );
            }

            if (key === 'code') {
              return <span className="text-xs text-slate-400">{service.code}</span>;
            }

            if (key === 'duration') {
              return (
                <span className="text-xs text-slate-400">
                  {service.duration_minutes} min
                </span>
              );
            }

            if (key === 'price') {
              return (
                <span className="text-xs text-slate-400">
                  {formatPriceFromCents(service.price_cents, service.currency)}
                </span>
              );
            }

            if (key === 'category') {
              return (
                <span className="text-xs text-slate-400">
                  {category?.name ?? '—'}
                </span>
              );
            }

            if (key === 'status') {
              return (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                    service.is_active
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800/80 text-slate-300 border border-slate-700/80'
                  }`}
                >
                  <span
                    className={`mr-1 h-1.5 w-1.5 rounded-full ${
                      service.is_active ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                  {service.is_active ? 'Activo' : 'Inactivo'}
                </span>
              );
            }

            if (key === 'actions') {
              return (
                <div className="flex justify-end">
                  <FloatMenu
                    placement="bottom-end"
                    options={[
                      { label: 'Editar', onClick: () => openEditModal(service) },
                      { divider: true },
                      {
                        label: deletingId === service.id ? 'Eliminando...' : 'Eliminar',
                        onClick: () => handleDeleteService(service.id),
                        disabled: deletingId === service.id,
                      },
                    ]}
                  >
                    <Button type="button" variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200" aria-label="Acciones">
                      ⋮
                    </Button>
                  </FloatMenu>
                </div>
              );
            }

            return null;
          }}
        />
        </div>
      )}
    </>
  );
}
