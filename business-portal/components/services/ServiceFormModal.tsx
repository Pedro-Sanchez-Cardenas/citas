import { useEffect, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { Button, Input, Select, Checkbox, Modal } from '@/components/ui';
import type { FormFieldErrors } from '@/lib/formErrors';
import type { ServiceFormPayload, ServiceWithCategory, ServiceCategory } from './types';

export interface ServiceFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: ServiceFormPayload) => Promise<void>;
  initialData: ServiceWithCategory | null;
  loading: boolean;
  categories: ServiceCategory[];
  fieldErrors: FormFieldErrors;
}

export function ServiceFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
  categories,
  fieldErrors,
}: ServiceFormModalProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [code, setCode] = useState(initialData?.code ?? '');
  const [durationMinutes, setDurationMinutes] = useState(
    initialData?.duration_minutes ?? 30
  );
  const [price, setPrice] = useState(
    initialData?.price_cents != null ? String(initialData.price_cents / 100) : ''
  );
  const [currency, setCurrency] = useState(initialData?.currency ?? 'USD');
  const [categoryId, setCategoryId] = useState(
    String(initialData?.service_category_id ?? '')
  );
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '');
      setCode(initialData?.code ?? '');
      setDurationMinutes(initialData?.duration_minutes ?? 30);
      setPrice(
        initialData?.price_cents != null
          ? String(initialData.price_cents / 100)
          : ''
      );
      setCurrency(initialData?.currency ?? 'USD');
      setCategoryId(String(initialData?.service_category_id ?? ''));
      setIsActive(initialData?.is_active ?? true);
    }
  }, [open, initialData]);

  const isEdit = !!initialData?.id;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: ServiceFormPayload = {
      name,
      code,
      duration_minutes: Number(durationMinutes) || 0,
      price_cents:
        price && !Number.isNaN(Number(price))
          ? Math.round(Number(price) * 100)
          : null,
      currency,
      service_category_id: categoryId ? Number(categoryId) : null,
      is_active: !!isActive,
    };
    void onSubmit(payload);
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
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="Corte de cabello, Manicure spa, Color completo..."
            error={fieldErrors.name}
          />
        </div>

        <Input
          label="Código interno"
          id="service-code"
          required
          value={code}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
          placeholder="Ej. CUT-BASICO, MANI-SPA"
          error={fieldErrors.code}
        />

        <Input
          label="Duración (minutos)"
          id="service-duration"
          type="number"
          min={1}
          required
          value={durationMinutes}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setDurationMinutes(Number(e.target.value))}
          placeholder="30"
          error={fieldErrors.duration_minutes}
        />

        <Input
          label="Precio"
          id="service-price"
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)}
          placeholder="Ej. 15.00"
          hint="Puedes dejarlo vacío si el precio se define caso por caso."
          error={fieldErrors.price_cents}
        />

        <Select
          label="Moneda"
          id="service-currency"
          value={currency}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setCurrency(e.target.value)}
          error={fieldErrors.currency}
        >
          <option value="USD">USD (US Dollar)</option>
          <option value="MXN">MXN (Peso mexicano)</option>
          <option value="EUR">EUR (Euro)</option>
        </Select>

        <Select
          label="Categoría"
          id="service-category"
          value={String(categoryId ?? '')}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setCategoryId(e.target.value)}
          hint="Opcional, pero recomendado para ordenar tu catálogo."
          error={fieldErrors.service_category_id}
        >
          <option value="">Sin categoría</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>

        <div className="md:col-span-2 flex flex-col items-start gap-1 pt-2">
          <Checkbox
            checked={!!isActive}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)}
            label="Servicio activo y visible en la agenda"
          />
          {fieldErrors.is_active && (
            <p className="text-[11px] text-red-300" role="alert">
              {fieldErrors.is_active}
            </p>
          )}
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
