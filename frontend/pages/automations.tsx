import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { FormEvent, ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchAutomations,
  createAutomation,
  updateAutomation,
  deleteAutomation,
} from '@/lib/api/automations';
import { extractFieldErrors, type FormFieldErrors } from '@/lib/formErrors';
import { Button, Input, Select, Checkbox, Modal, Textarea, Table, FloatMenu } from '@/components/ui';
import type { AxiosError } from 'axios';

const TRIGGER_OPTIONS = [
  { value: 'appointment_reminder', label: 'Recordatorio de cita' },
  { value: 'inactive_client', label: 'Cliente inactivo' },
  { value: 'birthday', label: 'Cumpleaños' },
  { value: 'promotion', label: 'Promoción' },
];

interface AutomationRecord {
  id: number;
  name: string;
  trigger?: string;
  is_active?: boolean;
  conditions?: unknown;
  action?: unknown;
  [key: string]: unknown;
}

interface AutomationFormPayload {
  name: string;
  trigger: string;
  conditions?: unknown;
  action?: unknown;
  is_active: boolean;
}

interface AutomationFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: AutomationFormPayload) => Promise<void>;
  initialData: AutomationRecord | null;
  loading: boolean;
  fieldErrors: FormFieldErrors;
}

function AutomationFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
  fieldErrors,
}: AutomationFormModalProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [trigger, setTrigger] = useState(initialData?.trigger ?? 'appointment_reminder');
  const [conditionsJson, setConditionsJson] = useState(
    initialData?.conditions ? JSON.stringify(initialData.conditions, null, 2) : '{\n\n}'
  );
  const [actionJson, setActionJson] = useState(
    initialData?.action ? JSON.stringify(initialData.action, null, 2) : '{\n\n}'
  );
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '');
      setTrigger(initialData?.trigger ?? 'appointment_reminder');
      setConditionsJson(
        initialData?.conditions
          ? JSON.stringify(initialData.conditions, null, 2)
          : '{\n\n}'
      );
      setActionJson(
        initialData?.action
          ? JSON.stringify(initialData.action, null, 2)
          : '{\n\n}'
      );
      setIsActive(initialData?.is_active ?? true);
    }
  }, [open, initialData]);

  const isEdit = !!initialData?.id;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let conditions: unknown = null;
    let action: unknown = null;
    try {
      const trimmed = conditionsJson.trim();
      if (trimmed) {
        conditions = JSON.parse(conditionsJson);
      }
    } catch {
      // dejamos que el backend valide si es necesario
    }
    try {
      const trimmed = actionJson.trim();
      if (trimmed) {
        action = JSON.parse(actionJson);
      }
    } catch {
      // idem
    }

    const payload: AutomationFormPayload = {
      name,
      trigger,
      conditions,
      action,
      is_active: !!isActive,
    };
    void onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar automatización' : 'Nueva automatización'}
      description="Crea reglas automáticas para recordar citas, reactivar clientes o enviar promociones."
      size="lg"
    >
      <form
        className="mt-1 grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <div className="md:col-span-2">
          <Input
            label="Nombre"
            id="automation-name"
            required
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="Recordatorio 24h antes de la cita"
            error={fieldErrors.name}
          />
        </div>

        <Select
          label="Disparador"
          id="automation-trigger"
          value={trigger}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setTrigger(e.target.value)}
          error={fieldErrors.trigger}
        >
          {TRIGGER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>

        <div className="md:col-span-2">
          <Textarea
            label="Condiciones (JSON)"
            id="automation-conditions"
            rows={5}
            value={conditionsJson}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setConditionsJson(e.target.value)}
            hint="Configura filtros como días de anticipación, tipos de servicio, etc."
            error={fieldErrors.conditions}
          />
        </div>

        <div className="md:col-span-2">
          <Textarea
            label="Acción (JSON)"
            id="automation-action"
            rows={5}
            value={actionJson}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setActionJson(e.target.value)}
            hint="Define mensajes, canales (SMS/email) y otros parámetros."
            error={fieldErrors.action}
          />
        </div>

        <div className="md:col-span-2 flex items-center justify-between pt-2">
          <Checkbox
            checked={!!isActive}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)}
            label="Automatización activa"
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
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear automatización'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

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
          if (ax?.response?.status === 401) {
            logout();
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAutomations();

    return () => {
      cancelled = true;
    };
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
        const updated = await updateAutomation(selectedAutomation.id, formData as unknown as Record<string, unknown>);
        setAutomations((prev) =>
          prev.map((a) => (a.id === selectedAutomation.id ? (updated as AutomationRecord) ?? a : a))
        );
      } else {
        const created = await createAutomation(formData as unknown as Record<string, unknown>);
        if (created) setAutomations((prev) => [created as AutomationRecord, ...prev]);
      }
      setModalOpen(false);
      setSelectedAutomation(null);
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
          'No se pudo guardar la automatización. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteAutomation = async (id: number) => {
    if (!window.confirm('¿Eliminar esta automatización? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeletingId(id);
    setError('');
    try {
      await deleteAutomation(id);
      setAutomations((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
          'No se pudo eliminar la automatización. Inténtalo nuevamente.'
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

      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Automatizaciones
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Configura reglas automáticas para recordar citas, reactivar clientes y enviar promociones.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal} size="md">
          <span className="mr-2 text-base">＋</span>
          Nueva automatización
        </Button>
      </header>

      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="relative">
            <Input
              type="text"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o disparador..."
              inputClassName="pl-9 rounded-2xl border-slate-800/80 bg-slate-950/70"
            />
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
              🔍
            </span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500">
          {filteredAutomations.length} automatización
          {filteredAutomations.length === 1 ? '' : 'es'} visibles
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.25)]">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="mt-10 flex items-center justify-center text-sm text-slate-400">
          Cargando automatizaciones...
        </div>
      ) : filteredAutomations.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/60 px-6 py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-xl">
            ⚙️
          </div>
          <h3 className="text-sm font-medium text-slate-100">
            Aún no tienes automatizaciones configuradas
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            Crea tu primera automatización para ahorrar tiempo en recordatorios y campañas.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 bg-slate-100 text-slate-900 hover:bg-slate-200 border-transparent"
            onClick={openCreateModal}
          >
            Crear automatización
          </Button>
        </div>
      ) : (
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
              TRIGGER_OPTIONS.find((t) => t.value === auto.trigger)?.label ??
              auto.trigger;

            if (key === 'name') {
              return (
                <span className="text-sm font-medium text-slate-50">
                  {auto.name}
                </span>
              );
            }

            if (key === 'trigger') {
              return (
                <span className="text-xs text-slate-400">
                  {triggerLabel}
                </span>
              );
            }

            if (key === 'status') {
              return (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                    auto.is_active
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800/80 text-slate-300 border border-slate-700/80'
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
      )}
    </>
  );
}
