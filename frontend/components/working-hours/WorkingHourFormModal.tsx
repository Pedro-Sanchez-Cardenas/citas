import { useEffect, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { Button, Input, Select, Checkbox, Modal, DatePicker } from '@/components/ui';
import type { FormFieldErrors } from '@/lib/formErrors';
import type { WorkingHour, CreateWorkingHourPayload } from '@/lib/api/workingHours';
import type { Branch, Professional } from '@/types';
import { WEEKDAYS } from './utils';

export interface WorkingHourFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateWorkingHourPayload) => Promise<void>;
  initialData: WorkingHour | null;
  loading: boolean;
  branches: Branch[];
  professionals: Professional[];
  fieldErrors: FormFieldErrors;
}

export function WorkingHourFormModal({
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
  }, [open, initialData, branches]);

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

        <div className="flex items-center justify-between pt-2 md:col-span-2">
          <Checkbox
            checked={!!isActive}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)}
            label="Horario activo"
          />
        </div>

        <div className="mt-2 flex items-center justify-end gap-2 md:col-span-2">
          <Button type="button" variant="subtle" size="sm" onClick={onClose}>
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
