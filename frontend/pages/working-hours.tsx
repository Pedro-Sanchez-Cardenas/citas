import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { FormEvent, ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchWorkingHours,
  createWorkingHour,
  updateWorkingHour,
  deleteWorkingHour,
  type WorkingHour,
  type CreateWorkingHourPayload,
} from '@/lib/api/workingHours';
import { fetchProfessionals } from '@/lib/api/professionals';
import { fetchBranches } from '@/lib/api/branches';
import { extractFieldErrors, type FormFieldErrors } from '@/lib/formErrors';
import { formatDate } from '@/lib/format';
import { Button, Input, Select, Checkbox, Modal, Table, FloatMenu, DatePicker } from '@/components/ui';
import type { Branch, Professional } from '@/types';
import type { AxiosError } from 'axios';

const WEEKDAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

interface WorkingHourFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateWorkingHourPayload) => Promise<void>;
  initialData: WorkingHour | null;
  loading: boolean;
  branches: Branch[];
  professionals: Professional[];
  fieldErrors: FormFieldErrors;
}

function WorkingHourFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
  branches,
  professionals,
  fieldErrors,
}: WorkingHourFormModalProps) {
  const [branchId, setBranchId] = useState<string | number>(initialData?.branch_id ?? '');
  const [weekday, setWeekday] = useState(initialData?.weekday ?? 1);
  const [startTime, setStartTime] = useState(initialData?.start_time ?? '09:00');
  const [endTime, setEndTime] = useState(initialData?.end_time ?? '18:00');
  const [professionalId, setProfessionalId] = useState(
    initialData?.professional_id ?? ''
  );
  const [effectiveFrom, setEffectiveFrom] = useState(
    initialData?.effective_from ?? ''
  );
  const [effectiveUntil, setEffectiveUntil] = useState(
    initialData?.effective_until ?? ''
  );
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  useEffect(() => {
    if (open) {
      const defaultBranch =
        initialData?.branch_id ??
        (branches.length === 1 ? branches[0]?.id : '');
      setBranchId(defaultBranch);
      setWeekday(initialData?.weekday ?? 1);
      setStartTime(initialData?.start_time ?? '09:00');
      setEndTime(initialData?.end_time ?? '18:00');
      setProfessionalId(initialData?.professional_id ?? '');
      setEffectiveFrom(initialData?.effective_from ?? '');
      setEffectiveUntil(initialData?.effective_until ?? '');
      setIsActive(initialData?.is_active ?? true);
    }
  }, [open, initialData]);

  const isEdit = !!initialData?.id;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: CreateWorkingHourPayload = {
      branch_id: branchId !== '' ? Number(branchId) : null,
      weekday: Number(weekday),
      start_time: startTime,
      end_time: endTime,
      professional_id: professionalId ? Number(professionalId) : null,
      effective_from: effectiveFrom || null,
      effective_until: effectiveUntil || null,
      is_active: !!isActive,
    };
    void onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar horario' : 'Nuevo horario'}
      description="Configura los horarios base en los que tu equipo puede recibir citas."
      size="lg"
    >
      <form
        className="mt-1 grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <Select
          label="Sucursal"
          id="wh-branch"
          value={String(branchId)}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setBranchId(e.target.value)}
          error={fieldErrors.branch_id}
          required
        >
          <option value="">Selecciona una sucursal</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>

        <Select
          label="Día de la semana"
          id="wh-weekday"
          value={String(weekday)}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setWeekday(Number(e.target.value))}
          error={fieldErrors.weekday}
        >
          {WEEKDAYS.map((label, index) => (
            <option key={index} value={index}>
              {label}
            </option>
          ))}
        </Select>

        <Select
          label="Profesional (opcional)"
          id="wh-professional"
          value={String(professionalId)}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setProfessionalId(e.target.value)}
          error={fieldErrors.professional_id}
        >
          <option value="">Horario general de sucursal</option>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>

        <Input
          label="Hora inicio"
          id="wh-start-time"
          type="time"
          required
          value={startTime}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
          error={fieldErrors.start_time}
        />

        <Input
          label="Hora fin"
          id="wh-end-time"
          type="time"
          required
          value={endTime}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
          error={fieldErrors.end_time}
        />

        <DatePicker
          label="Válido desde"
          id="wh-effective-from"
          value={effectiveFrom || null}
          onChange={(_, dateStr) => setEffectiveFrom(dateStr || '')}
          error={fieldErrors.effective_from}
        />

        <DatePicker
          label="Válido hasta"
          id="wh-effective-until"
          value={effectiveUntil || null}
          onChange={(_, dateStr) => setEffectiveUntil(dateStr || '')}
          error={fieldErrors.effective_until}
        />

        <div className="md:col-span-2 flex items-center justify-between pt-2">
          <Checkbox
            checked={!!isActive}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)}
            label="Horario activo"
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
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear horario'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function WorkingHoursPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [hours, setHours] = useState<WorkingHour[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [selectedHour, setSelectedHour] = useState<WorkingHour | null>(null);
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
        const [hoursData, professionalsData, branchesData] = await Promise.all([
          fetchWorkingHours(),
          fetchProfessionals(),
          fetchBranches(),
        ]);
        if (!cancelled) {
          setHours(Array.isArray(hoursData) ? hoursData : []);
          setProfessionals(
            Array.isArray(professionalsData) ? professionalsData : []
          );
          setBranches(Array.isArray(branchesData) ? branchesData : []);
        }
      } catch (err) {
        if (!cancelled) {
          const ax = err as AxiosError<{ message?: string }>;
          setError(
            ax?.response?.data?.message ||
              'No se pudieron cargar los horarios.'
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

  const professionalById = useMemo(() => {
    const map = new Map<number, Professional>();
    professionals.forEach((p) => map.set(p.id, p));
    return map;
  }, [professionals]);

  const filteredHours = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return hours;
    return hours.filter((row) => {
      const workingHourWithProf = row as WorkingHour & { professional?: { name: string } };
      const professionalName = String(
        workingHourWithProf.professional?.name ??
          professionalById.get(row.professional_id ?? 0)?.name ??
          ''
      ).toLowerCase();
      const weekdayLabel = WEEKDAYS[row.weekday ?? 0].toLowerCase();
      return professionalName.includes(q) || weekdayLabel.includes(q);
    });
  }, [hours, search, professionalById]);

  const isLoading = authLoading || loading;

  const openCreateModal = () => {
    setFieldErrors({});
    setSelectedHour(null);
    setModalOpen(true);
  };

  const openEditModal = (hour: WorkingHour) => {
    setFieldErrors({});
    setSelectedHour(hour);
    setModalOpen(true);
  };

  const handleSubmitHour = async (formData: CreateWorkingHourPayload) => {
    setModalLoading(true);
    setError('');
    setFieldErrors({});
    try {
      if (selectedHour?.id) {
        const updated = await updateWorkingHour(selectedHour.id, formData);
        setHours((prev) =>
          prev.map((h) => (h.id === selectedHour.id ? updated ?? h : h))
        );
      } else {
        const created = await createWorkingHour(formData);
        if (created) setHours((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setSelectedHour(null);
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
          'No se pudo guardar el horario. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteHour = async (id: number) => {
    if (!window.confirm('¿Eliminar este horario? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeletingId(id);
    setError('');
    try {
      await deleteWorkingHour(id);
      setHours((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
          'No se pudo eliminar el horario. Inténtalo nuevamente.'
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
      <WorkingHourFormModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setFieldErrors({});
            setModalOpen(false);
            setSelectedHour(null);
          }
        }}
        onSubmit={handleSubmitHour}
        initialData={selectedHour}
        loading={modalLoading}
        branches={branches}
        professionals={professionals}
        fieldErrors={fieldErrors}
      />

      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Horarios de trabajo
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Define los horarios en los que tu equipo puede recibir citas.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal} size="md">
          <span className="mr-2 text-base">＋</span>
          Nuevo horario
        </Button>
      </header>

      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="relative">
            <Input
              type="text"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Buscar por profesional o día..."
              inputClassName="pl-9 rounded-2xl border-slate-800/80 bg-slate-950/70"
            />
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
              🔍
            </span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500">
          {filteredHours.length} horario
          {filteredHours.length === 1 ? '' : 's'} visibles
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.25)]">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="mt-10 flex items-center justify-center text-sm text-slate-400">
          Cargando horarios...
        </div>
      ) : filteredHours.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/60 px-6 py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-xl">
            ⏰
          </div>
          <h3 className="text-sm font-medium text-slate-100">
            Aún no has configurado horarios
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            Define horarios por día y profesional para que la agenda pueda validar la disponibilidad.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 bg-slate-100 text-slate-900 hover:bg-slate-200 border-transparent"
            onClick={openCreateModal}
          >
            Crear horario
          </Button>
        </div>
      ) : (
        <Table<WorkingHour>
          columns={[
            { key: 'weekday', header: 'Día' },
            { key: 'professional', header: 'Profesional' },
            { key: 'time', header: 'Horario' },
            { key: 'range', header: 'Vigencia' },
            { key: 'status', header: 'Estado' },
            { key: 'actions', header: 'Acciones', align: 'right' },
          ]}
          items={filteredHours}
          getItemKey={(row) => row.id}
          renderCell={(row, key) => {
            const rowWithProf = row as WorkingHour & { professional?: { name: string } };
            const professional =
              rowWithProf.professional ?? professionalById.get(row.professional_id ?? 0);

            if (key === 'weekday') {
              return (
                <span className="text-sm font-medium text-slate-50">
                  {WEEKDAYS[row.weekday ?? 0]}
                </span>
              );
            }

            if (key === 'professional') {
              return (
                <span className="text-xs text-slate-400">
                  {professional?.name ?? 'Horario general'}
                </span>
              );
            }

            if (key === 'time') {
              return (
                <span className="text-xs text-slate-400">
                  {row.start_time} - {row.end_time}
                </span>
              );
            }

            if (key === 'range') {
              return (
                <span className="text-xs text-slate-400">
                  {row.effective_from ? formatDate(row.effective_from) : 'Desde siempre'}{' '}
                  {row.effective_until ? `→ ${formatDate(row.effective_until)}` : ''}
                </span>
              );
            }

            if (key === 'status') {
              return (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                    row.is_active
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800/80 text-slate-300 border border-slate-700/80'
                  }`}
                >
                  <span
                    className={`mr-1 h-1.5 w-1.5 rounded-full ${
                      row.is_active ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                  {row.is_active ? 'Activo' : 'Inactivo'}
                </span>
              );
            }

            if (key === 'actions') {
              return (
                <div className="flex justify-end">
                  <FloatMenu
                    placement="bottom-end"
                    options={[
                      { label: 'Editar', onClick: () => openEditModal(row) },
                      { divider: true },
                      {
                        label: deletingId === row.id ? 'Eliminando...' : 'Eliminar',
                        onClick: () => handleDeleteHour(row.id),
                        disabled: deletingId === row.id,
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
