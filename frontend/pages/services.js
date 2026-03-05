import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchServices,
  createService,
  updateService,
  deleteService,
} from '@/lib/api/services';
import { fetchServiceCategories } from '@/lib/api/serviceCategories';
import { Button, Input, Select, Checkbox, Modal } from '@/components/ui';

function formatPriceFromCents(priceCents, currency = 'USD') {
  if (priceCents == null) return '—';
  const amount = (priceCents / 100).toFixed(2);
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '$';
  return `${symbol}${amount} ${currency}`;
}

function ServiceFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
  categories,
}) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [code, setCode] = useState(initialData?.code ?? '');
  const [durationMinutes, setDurationMinutes] = useState(
    initialData?.duration_minutes ?? 30
  );
  const [price, setPrice] = useState(
    initialData?.price_cents != null ? (initialData.price_cents / 100).toString() : ''
  );
  const [currency, setCurrency] = useState(initialData?.currency ?? 'USD');
  const [categoryId, setCategoryId] = useState(
    initialData?.service_category_id ?? ''
  );
  const [isActive, setIsActive] = useState(
    initialData?.is_active ?? true
  );

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '');
      setCode(initialData?.code ?? '');
      setDurationMinutes(initialData?.duration_minutes ?? 30);
      setPrice(
        initialData?.price_cents != null
          ? (initialData.price_cents / 100).toString()
          : ''
      );
      setCurrency(initialData?.currency ?? 'USD');
      setCategoryId(initialData?.service_category_id ?? '');
      setIsActive(initialData?.is_active ?? true);
    }
  }, [open, initialData]);

  const isEdit = !!initialData?.id;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name,
      code,
      duration_minutes: Number(durationMinutes) || 0,
      price_cents:
        price && !Number.isNaN(Number(price))
          ? Math.round(Number(price) * 100)
          : null,
      currency,
      service_category_id: categoryId || null,
      is_active: !!isActive,
    };
    onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar servicio' : 'Nuevo servicio'}
      description="Configura los detalles principales de tu servicio: duración, precio y categoría."
      size="lg"
    >
      <form className="mt-1 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="md:col-span-2">
          <Input
            label="Nombre del servicio"
            id="service-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Corte de cabello, Manicure spa, Color completo..."
          />
        </div>

        <Input
          label="Código interno"
          id="service-code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ej. CUT-BASICO, MANI-SPA"
        />

        <Input
          label="Duración (minutos)"
          id="service-duration"
          type="number"
          min={1}
          required
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          placeholder="30"
        />

        <Input
          label="Precio"
          id="service-price"
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Ej. 15.00"
          hint="Puedes dejarlo vacío si el precio se define caso por caso."
        />

        <Select
          label="Moneda"
          id="service-currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          <option value="USD">USD (US Dollar)</option>
          <option value="MXN">MXN (Peso mexicano)</option>
          <option value="EUR">EUR (Euro)</option>
        </Select>

        <Select
          label="Categoría"
          id="service-category"
          value={categoryId ?? ''}
          onChange={(e) => setCategoryId(e.target.value)}
          hint="Opcional, pero recomendado para ordenar tu catálogo."
        >
          <option value="">Sin categoría</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>

        <div className="md:col-span-2 flex items-center justify-between pt-2">
          <Checkbox
            checked={!!isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            label="Servicio activo y visible en la agenda"
          />
        </div>

        <div className="md:col-span-2 mt-2 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear servicio'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function ServicesPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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
          setServices(Array.isArray(servicesData) ? servicesData : []);
          setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              'No se pudieron cargar los servicios.'
          );
          if (err?.response?.status === 401) {
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
    const map = new Map();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const isLoading = authLoading || loading;

  const openCreateModal = () => {
    setSelectedService(null);
    setModalOpen(true);
  };

  const openEditModal = (service) => {
    setSelectedService(service);
    setModalOpen(true);
  };

  const handleSubmitService = async (formData) => {
    setModalLoading(true);
    setError('');
    try {
      if (selectedService?.id) {
        const updated = await updateService(selectedService.id, formData);
        setServices((prev) =>
          prev.map((s) => (s.id === selectedService.id ? updated ?? s : s))
        );
      } else {
        const created = await createService(formData);
        setServices((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setSelectedService(null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'No se pudo guardar el servicio. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('¿Eliminar este servicio? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeletingId(id);
    setError('');
    try {
      await deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
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
    <DashboardLayout user={user} onLogout={logout}>
      <ServiceFormModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setModalOpen(false);
            setSelectedService(null);
          }
        }}
        onSubmit={handleSubmitService}
        initialData={selectedService}
        loading={modalLoading}
        categories={categories}
      />

      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Servicios
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Gestiona el catálogo de servicios de tu negocio: duración, precio, categoría y estado.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal} size="md">
          <span className="mr-2 text-base">＋</span>
          Nuevo servicio
        </Button>
      </header>

      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="relative">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o código..."
              inputClassName="pl-9 rounded-2xl border-slate-800/80 bg-slate-950/70"
            />
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
              🔍
            </span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500">
          {filteredServices.length} servicio
          {filteredServices.length === 1 ? '' : 's'} visibles
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.25)]">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="mt-10 flex items-center justify-center text-sm text-slate-400">
          Cargando servicios...
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/60 px-6 py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-xl">
            ✂️
          </div>
          <h3 className="text-sm font-medium text-slate-100">
            Aún no tienes servicios creados
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            Crea tus primeros servicios para empezar a agendar citas de forma organizada y con precios claros.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 bg-slate-100 text-slate-900 hover:bg-slate-200 border-transparent"
            onClick={openCreateModal}
          >
            Crear servicio
          </Button>
        </div>
      ) : (
        <div className="mt-2 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.85)]">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Duración</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => {
                const category =
                  service.service_category ??
                  categoryById.get(service.service_category_id);
                return (
                  <tr
                    key={service.id}
                    className="border-t border-slate-800/80 hover:bg-slate-900/70"
                  >
                    <td className="px-4 py-3 align-top text-sm font-medium text-slate-50">
                      {service.name}
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-400">
                      {service.code}
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-400">
                      {service.duration_minutes} min
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-400">
                      {formatPriceFromCents(service.price_cents, service.currency)}
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-400">
                      {category?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 align-top text-xs">
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
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="subtle"
                          size="sm"
                          className="text-[11px]"
                          onClick={() => openEditModal(service)}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          className="text-[11px]"
                          onClick={() => handleDeleteService(service.id)}
                          disabled={deletingId === service.id}
                        >
                          {deletingId === service.id ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}

