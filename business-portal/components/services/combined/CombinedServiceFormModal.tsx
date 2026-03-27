import { useEffect, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { Button, Input, Select, Checkbox, Modal } from '@/components/ui';
import type { FormFieldErrors } from '@/lib/formErrors';
import type { Service } from '@/types';
import type {
  CombinedItemRow,
  CombinedServiceRecord,
  CombinedFormPayload,
} from './types';

export interface CombinedServiceFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CombinedFormPayload) => Promise<void>;
  initialData: CombinedServiceRecord | null;
  loading: boolean;
  services: Service[];
  fieldErrors: FormFieldErrors;
}

export function CombinedServiceFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
  services,
  fieldErrors,
}: CombinedServiceFormModalProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [code, setCode] = useState(initialData?.code ?? '');
  const [totalDuration, setTotalDuration] = useState(
    String(initialData?.total_duration_minutes ?? '')
  );
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [items, setItems] = useState<CombinedItemRow[]>(
    Array.isArray(initialData?.items) && initialData.items.length > 0
      ? initialData.items.map((ci) => ({
          service_id: String(ci.service_id ?? ''),
          position: ci.position ?? 1,
          offset_minutes: ci.offset_minutes ?? 0,
          duration_minutes: ci.duration_minutes ?? '',
        }))
      : [{ service_id: '', position: 1, offset_minutes: 0, duration_minutes: '' }]
  );

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '');
      setCode(initialData?.code ?? '');
      setTotalDuration(String(initialData?.total_duration_minutes ?? ''));
      setIsActive(initialData?.is_active ?? true);
      setItems(
        Array.isArray(initialData?.items) && initialData.items.length > 0
          ? initialData.items.map((ci) => ({
              service_id: String(ci.service_id ?? ''),
              position: ci.position ?? 1,
              offset_minutes: ci.offset_minutes ?? 0,
              duration_minutes: ci.duration_minutes ?? '',
            }))
          : [{ service_id: '', position: 1, offset_minutes: 0, duration_minutes: '' }]
      );
    }
  }, [open, initialData]);

  const isEdit = !!initialData?.id;

  const handleChangeItem = (index: number, field: keyof CombinedItemRow, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { service_id: '', position: prev.length + 1, offset_minutes: 0, duration_minutes: '' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: CombinedFormPayload = {
      name,
      code,
      total_duration_minutes: totalDuration ? Number(totalDuration) : null,
      is_active: !!isActive,
      // No filtramos items aquí: así los índices que devuelve el backend (`items.0.*`, `items.1.*`)
      // coinciden con los inputs visibles.
      items: items.map((item, idx) => ({
        service_id: item.service_id ? Number(item.service_id) : null,
        position: item.position || idx + 1,
        offset_minutes: item.offset_minutes ? Number(item.offset_minutes) : 0,
        duration_minutes: item.duration_minutes ? Number(item.duration_minutes) : null,
      })),
    };
    void onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar servicio combinado' : 'Nuevo servicio combinado'}
      description="Crea paquetes de servicios (ej. corte + barba + cejas) con duración total."
      size="lg"
    >
      <form className="mt-1 space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Nombre"
            id="combined-name"
            required
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="Corte + Barba Premium"
            error={fieldErrors.name}
          />
          <Input
            label="Código"
            id="combined-code"
            required
            value={code}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
            placeholder="COMB-001"
            error={fieldErrors.code}
          />
          <Input
            label="Duración total (min)"
            id="combined-total-duration"
            type="number"
            min={1}
            value={totalDuration}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTotalDuration(e.target.value)}
            placeholder="Ej. 90"
            error={fieldErrors.total_duration_minutes}
          />
          <div className="flex flex-col items-start gap-1 pt-5">
            <Checkbox
              checked={!!isActive}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)}
              label="Servicio combinado activo"
            />
            {fieldErrors.is_active && (
              <p className="text-[11px] text-red-300" role="alert">
                {fieldErrors.is_active}
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Servicios incluidos
            </h3>
            <Button type="button" variant="subtle" size="sm" className="text-[11px]" onClick={handleAddItem}>
              Añadir servicio
            </Button>
          </div>
          {fieldErrors.items && (
            <p className="mb-2 text-[11px] text-red-300" role="alert">
              {fieldErrors.items}
            </p>
          )}
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="surface-inset grid grid-cols-1 gap-3 p-3 md:grid-cols-4"
              >
                <Select
                  label="Servicio"
                  value={String(item.service_id)}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    handleChangeItem(index, 'service_id', e.target.value)
                  }
                  error={fieldErrors[`items.${index}.service_id`]}
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
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleChangeItem(index, 'position', Number(e.target.value))
                  }
                  error={fieldErrors[`items.${index}.position`]}
                />
                <Input
                  label="Offset (min)"
                  type="number"
                  min={0}
                  value={item.offset_minutes ?? 0}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleChangeItem(index, 'offset_minutes', Number(e.target.value))
                  }
                  error={fieldErrors[`items.${index}.offset_minutes`]}
                />
                <div className="flex items-end gap-2">
                  <Input
                    label="Duración (min)"
                    type="number"
                    min={1}
                    value={item.duration_minutes ?? ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleChangeItem(
                        index,
                        'duration_minutes',
                        e.target.value ? Number(e.target.value) : ''
                      )
                    }
                    error={fieldErrors[`items.${index}.duration_minutes`]}
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

        <div className="form-divider mt-2 flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="subtle" size="sm" onClick={onClose}>
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
