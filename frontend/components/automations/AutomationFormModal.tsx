import { useEffect, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { Button, Input, Select, Checkbox, Modal, Textarea } from '@/components/ui';
import type { FormFieldErrors } from '@/lib/formErrors';
import type { AutomationRecord, AutomationFormPayload } from './types';
import { TRIGGER_OPTIONS } from './utils';

export interface AutomationFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: AutomationFormPayload) => Promise<void>;
  initialData: AutomationRecord | null;
  loading: boolean;
  fieldErrors: FormFieldErrors;
}

export function AutomationFormModal({
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
      if (trimmed) conditions = JSON.parse(conditionsJson);
    } catch {
      // backend validará si es necesario
    }
    try {
      const trimmed = actionJson.trim();
      if (trimmed) action = JSON.parse(actionJson);
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

        <div className="flex items-center justify-between pt-2 md:col-span-2">
          <Checkbox
            checked={!!isActive}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)}
            label="Automatización activa"
          />
        </div>

        <div className="mt-2 flex items-center justify-end gap-2 md:col-span-2">
          <Button type="button" variant="subtle" size="sm" onClick={onClose}>
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
