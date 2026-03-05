import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchCombinedServices,
  createCombinedService,
  updateCombinedService,
  deleteCombinedService,
} from '@/lib/api/combinedServices';
import { fetchServices } from '@/lib/api/services';
import { Button, Input, Select, Checkbox, Modal, Table } from '@/components/ui';

function CombinedServiceFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
  services,
}) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [code, setCode] = useState(initialData?.code ?? '');
  const [totalDuration, setTotalDuration] = useState(
    initialData?.total_duration_minutes ?? ''
  );
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [items, setItems] = useState(
    Array.isArray(initialData?.items) && initialData.items.length > 0
      ? initialData.items
      : [{ service_id: '', position: 1, offset_minutes: 0, duration_minutes: '' }]
  );

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '');
      setCode(initialData?.code ?? '');
      setTotalDuration(initialData?.total_duration_minutes ?? '');
      setIsActive(initialData?.is_active ?? true);
      setItems(
        Array.isArray(initialData?.items) && initialData.items.length > 0
          ? initialData.items
          : [{ service_id: '', position: 1, offset_minutes: 0, duration_minutes: '' }]
      );
    }
  }, [open, initialData]);

  const isEdit = !!initialData?.id;

  const handleChangeItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        service_id: '',
        position: prev.length + 1,
        offset_minutes: 0,
        duration_minutes: '',
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name,
      code,
      total_duration_minutes: totalDuration
        ? Number(totalDuration)
        : null,
      is_active: !!isActive,
      items: items
        .filter((item) => item.service_id)
        .map((item, idx) => ({
          service_id: Number(item.service_id),
          position: item.position || idx + 1,
          offset_minutes: item.offset_minutes
            ? Number(item.offset_minutes)
            : 0,
          duration_minutes: item.duration_minutes
            ? Number(item.duration_minutes)
            : null,
        })),
    };
    onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar servicio combinado' : 'Nuevo servicio combinado'}
      description="Crea paquetes de servicios (ej. corte + barba + cejas) con duración total."
      size="lg"
    >
      <form
        className="mt-1 space-y-5"
        onSubmit={handleSubmit}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Nombre"
            id="combined-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Corte + Barba Premium"
          />

          <Input
            label="Código"
            id="combined-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="COMB-001"
          />

          <Input
            label="Duración total (min)"
            id="combined-total-duration"
            type="number"
            min={1}
            value={totalDuration}
            onChange={(e) => setTotalDuration(e.target.value)}
            placeholder="Ej. 90"
          />

          <div className="flex items-center pt-5">
            <Checkbox
              checked={!!isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              label="Servicio combinado activo"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Servicios incluidos
            </h3>
            <Button
              type="button"
              variant="subtle"
              size="sm"
              className="text-[11px]"
              onClick={handleAddItem}
            >
              Añadir servicio
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-3 md:grid-cols-4"
              >
                <Select
                  label="Servicio"
                  value={item.service_id}
                  onChange={(e) =>
                    handleChangeItem(index, 'service_id', e.target.value)
                  }
                >
                  <option value="">Selecciona servicio</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Posición"
                  type="number"
                  min={1}
                  value={item.position ?? index + 1}
                  onChange={(e) =>
                    handleChangeItem(index, 'position', Number(e.target.value))
                  }
                />
                <Input
                  label="Offset (min)"
                  type="number"
                  min={0}
                  value={item.offset_minutes ?? 0}
                  onChange={(e) =>
                    handleChangeItem(
                      index,
                      'offset_minutes',
                      Number(e.target.value)
                    )
                  }
                />
                <div className="flex items-end gap-2">
                  <Input
                    label="Duración (min)"
                    type="number"
                    min={1}
                    value={item.duration_minutes ?? ''}
                    onChange={(e) =>
                      handleChangeItem(
                        index,
                        'duration_minutes',
                        e.target.value ? Number(e.target.value) : ''
                      )
                    }
                  />
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      className="mb-2 text-[11px]"
                      onClick={() => handleRemoveItem(index)}
                    >
                      Quitar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear combinado'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function CombinedServicesPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [combined, setCombined] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selected, setSelected] = useState(null);
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
        const [combinedData, servicesData] = await Promise.all([
          fetchCombinedServices(),
          fetchServices(),
        ]);
        if (!cancelled) {
          setCombined(Array.isArray(combinedData) ? combinedData : []);
          setServices(Array.isArray(servicesData) ? servicesData : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              'No se pudieron cargar los servicios combinados.'
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
    setSelected(null);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setSelected(item);
    setModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    setModalLoading(true);
    setError('');
    try {
      if (selected?.id) {
        const updated = await updateCombinedService(selected.id, formData);
        setCombined((prev) =>
          prev.map((c) => (c.id === selected.id ? updated ?? c : c))
        );
      } else {
        const created = await createCombinedService(formData);
        setCombined((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setSelected(null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'No se pudo guardar el combinado. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este servicio combinado? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeletingId(id);
    setError('');
    try {
      await deleteCombinedService(id);
      setCombined((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'No se pudo eliminar el combinado. Inténtalo nuevamente.'
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
      <CombinedServiceFormModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setModalOpen(false);
            setSelected(null);
          }
        }}
        onSubmit={handleSubmit}
        initialData={selected}
        loading={modalLoading}
        services={services}
      />

      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Servicios combinados
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Crea paquetes de varios servicios para ofrecer experiencias completas.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal} size="md">
          <span className="mr-2 text-base">＋</span>
          Nuevo combinado
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
          {filteredCombined.length} combinado
          {filteredCombined.length === 1 ? '' : 's'} visibles
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.25)]">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="mt-10 flex items-center justify-center text-sm text-slate-400">
          Cargando servicios combinados...
        </div>
      ) : filteredCombined.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/60 px-6 py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-xl">
            💫
          </div>
          <h3 className="text-sm font-medium text-slate-100">
            Aún no tienes servicios combinados
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            Combina varios servicios en un solo paquete para vender experiencias completas.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 bg-slate-100 text-slate-900 hover:bg-slate-200 border-transparent"
            onClick={openCreateModal}
          >
            Crear combinado
          </Button>
        </div>
      ) : (
        <Table
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
                <span className="text-sm font-medium text-slate-50">
                  {item.name}
                </span>
              );
            }

            if (key === 'code') {
              return <span className="text-xs text-slate-400">{item.code}</span>;
            }

            if (key === 'duration') {
              return (
                <span className="text-xs text-slate-400">
                  {item.total_duration_minutes
                    ? `${item.total_duration_minutes} min`
                    : '—'}
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
                <span className="text-xs text-slate-400 wrap-break-word">
                  {servicesText}
                </span>
              );
            }

            if (key === 'status') {
              return (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                    item.is_active
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800/80 text-slate-300 border border-slate-700/80'
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
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="subtle"
                    size="sm"
                    className="text-[11px]"
                    onClick={() => openEditModal(item)}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    className="text-[11px]"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? 'Eliminando...' : 'Eliminar'}
                  </Button>
                </div>
              );
            }

            return null;
          }}
        />
      )}
    </DashboardLayout>
  );
}

