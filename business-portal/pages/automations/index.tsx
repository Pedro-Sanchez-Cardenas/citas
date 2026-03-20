import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchAutomations,
  createAutomation,
  updateAutomation,
  deleteAutomation,
} from '@/lib/api/automations';
import { extractFieldErrors, type FormFieldErrors } from '@/lib/formErrors';
import { Button, Input, Table, FloatMenu, EmptyState, Alert, PageHeader } from '@/components/ui';
import {
  AutomationFormModal,
  TRIGGER_OPTIONS,
  type AutomationRecord,
  type AutomationFormPayload,
} from '@/components/automations';
import type { AxiosError } from 'axios';
import { swalConfirm, swalError, swalSilentErrorText, swalSuccess } from '@/lib/swal';

export default function AutomationsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [automations, setAutomations] = useState<AutomationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [selectedAutomation, setSelectedAutomation] = useState<AutomationRecord | null>(null);
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

    async function loadAutomations() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchAutomations();
        if (!cancelled) {
          setAutomations(Array.isArray(data) ? (data as AutomationRecord[]) : []);
        }
      } catch (err) {
        if (!cancelled) {
          const ax = err as AxiosError<{ message?: string }>;
          setError(
            ax?.response?.data?.message ||
              'No se pudieron cargar las automatizaciones.'
          );
          if (ax?.response?.status === 401) logout();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAutomations();
    return () => { cancelled = true; };
  }, [user, logout]);

  const filteredAutomations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return automations;
    return automations.filter((auto) => {
      const name = String(auto.name ?? '').toLowerCase();
      const trigger = String(auto.trigger ?? '').toLowerCase();
      return name.includes(q) || trigger.includes(q);
    });
  }, [automations, search]);

  const isLoading = authLoading || loading;

  const openCreateModal = () => {
    setFieldErrors({});
    setSelectedAutomation(null);
    setModalOpen(true);
  };

  const openEditModal = (automation: AutomationRecord) => {
    setFieldErrors({});
    setSelectedAutomation(automation);
    setModalOpen(true);
  };

  const handleSubmitAutomation = async (formData: AutomationFormPayload) => {
    setModalLoading(true);
    setError('');
    setFieldErrors({});
    try {
      if (selectedAutomation?.id) {
        const updated = await updateAutomation(
          selectedAutomation.id,
          formData as unknown as Record<string, unknown>
        );
        setAutomations((prev) =>
          prev.map((a) =>
            a.id === selectedAutomation.id ? (updated as AutomationRecord) ?? a : a
          )
        );
      } else {
        const created = await createAutomation(
          formData as unknown as Record<string, unknown>
        );
        if (created) setAutomations((prev) => [created as AutomationRecord, ...prev]);
      }
      setModalOpen(false);
      setSelectedAutomation(null);
      void swalSuccess('Guardado correcto', 'La automatización se guardó correctamente.');
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      const msg = swalSilentErrorText(err);
      setError(msg);
      void swalError('Error al guardar', msg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteAutomation = async (id: number) => {
    const ok = await swalConfirm({
      title: 'Eliminar automatización',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!ok) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteAutomation(id);
      setAutomations((prev) => prev.filter((a) => a.id !== id));
      void swalSuccess('Eliminado', 'La automatización se eliminó correctamente.');
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
      <AutomationFormModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setFieldErrors({});
            setModalOpen(false);
            setSelectedAutomation(null);
          }
        }}
        onSubmit={handleSubmitAutomation}
        initialData={selectedAutomation}
        loading={modalLoading}
        fieldErrors={fieldErrors}
      />

      <PageHeader
        title="Automatizaciones"
        subtitle="Reglas automáticas para recordatorios, reactivación de clientes y promociones."
        action={
          <Button type="button" onClick={openCreateModal} size="md">
            <span className="mr-2 text-base">+</span>
            Nueva automatización
          </Button>
        }
      />

      <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Filtrar automatizaciones">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Input
              type="text"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o disparador..."
              inputClassName="pl-10 rounded-xl border-slate-700/80 bg-slate-950/50"
            />
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500" aria-hidden>🔍</span>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          {search.trim()
            ? `${filteredAutomations.length} de ${automations.length} automatizaciones`
            : `${automations.length} automatización${automations.length === 1 ? '' : 'es'}`}
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
            <span className="text-sm">Cargando automatizaciones...</span>
          </div>
        </div>
      ) : filteredAutomations.length === 0 ? (
        <EmptyState
          icon="⚙️"
          title={search.trim() ? 'No hay resultados' : 'Aún no hay automatizaciones'}
          description={
            search.trim()
              ? 'Prueba con otro término de búsqueda.'
              : 'Crea reglas automáticas para recordatorios y campañas.'
          }
          action={
            !search.trim() ? (
              <Button type="button" variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800" onClick={openCreateModal}>
                Crear primera automatización
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/40">
        <Table<AutomationRecord>
          columns={[
            { key: 'name', header: 'Nombre' },
            { key: 'trigger', header: 'Disparador' },
            { key: 'status', header: 'Estado' },
            { key: 'actions', header: 'Acciones', align: 'right' },
          ]}
          items={filteredAutomations}
          getItemKey={(auto) => auto.id}
          renderCell={(auto, key) => {
            const triggerLabel =
              TRIGGER_OPTIONS.find((t) => t.value === auto.trigger)?.label ?? auto.trigger;

            if (key === 'name') {
              return (
                <span className="text-sm font-medium text-slate-50">{auto.name}</span>
              );
            }
            if (key === 'trigger') {
              return (
                <span className="text-xs text-slate-400">{triggerLabel}</span>
              );
            }
            if (key === 'status') {
              return (
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
                    auto.is_active
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                      : 'border-slate-700/80 bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <span
                    className={`mr-1 h-1.5 w-1.5 rounded-full ${
                      auto.is_active ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                  {auto.is_active ? 'Activa' : 'Inactiva'}
                </span>
              );
            }
            if (key === 'actions') {
              return (
                <div className="flex justify-end">
                  <FloatMenu
                    placement="bottom-end"
                    options={[
                      { label: 'Editar', onClick: () => openEditModal(auto) },
                      { divider: true },
                      {
                        label: deletingId === auto.id ? 'Eliminando...' : 'Eliminar',
                        onClick: () => handleDeleteAutomation(auto.id),
                        disabled: deletingId === auto.id,
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
        </div>
      )}
    </>
  );
}
