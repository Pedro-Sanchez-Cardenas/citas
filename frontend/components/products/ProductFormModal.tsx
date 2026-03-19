import { useEffect, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { Button, Input, Select, Checkbox, Modal } from '@/components/ui';
import type { FormFieldErrors } from '@/lib/formErrors';
import type { ProductItem, ProductFormPayload } from './types';

export interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: ProductFormPayload) => Promise<void>;
  initialData: ProductItem | null;
  loading: boolean;
  fieldErrors: FormFieldErrors;
}

export function ProductFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
  fieldErrors,
}: ProductFormModalProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [sku, setSku] = useState(initialData?.sku ?? '');
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [unit, setUnit] = useState(initialData?.unit ?? 'unit');
  const [cost, setCost] = useState(
    initialData?.cost_cents != null ? String(initialData.cost_cents / 100) : ''
  );
  const [price, setPrice] = useState(
    initialData?.price_cents != null ? String(initialData.price_cents / 100) : ''
  );
  const [isReusable, setIsReusable] = useState(initialData?.is_reusable ?? false);

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '');
      setSku(initialData?.sku ?? '');
      setCategory(initialData?.category ?? '');
      setUnit(initialData?.unit ?? 'unit');
      setCost(
        initialData?.cost_cents != null ? String(initialData.cost_cents / 100) : ''
      );
      setPrice(
        initialData?.price_cents != null ? String(initialData.price_cents / 100) : ''
      );
      setIsReusable(initialData?.is_reusable ?? false);
    }
  }, [open, initialData]);

  const isEdit = !!initialData?.id;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: ProductFormPayload = {
      name,
      sku,
      category: category || null,
      unit: unit || 'unit',
      cost_cents:
        cost && !Number.isNaN(Number(cost)) ? Math.round(Number(cost) * 100) : 0,
      price_cents:
        price && !Number.isNaN(Number(price))
          ? Math.round(Number(price) * 100)
          : null,
      is_reusable: !!isReusable,
    };
    void onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar producto' : 'Nuevo producto'}
      description="Administra los productos que utilizas o vendes en tu negocio."
      size="lg"
    >
      <form
        className="mt-1 grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <div className="md:col-span-2">
          <Input
            label="Nombre del producto"
            id="product-name"
            required
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="Shampoo hidratante, Tinte rubio 7.1, etc."
            error={fieldErrors.name}
          />
        </div>

        <Input
          label="SKU"
          id="product-sku"
          required
          value={sku}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSku(e.target.value)}
          placeholder="Código interno único"
          error={fieldErrors.sku}
        />

        <Input
          label="Categoría"
          id="product-category"
          value={category}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setCategory(e.target.value)}
          placeholder="Color, Tratamientos, Uñas, Barbería..."
          error={fieldErrors.category}
        />

        <Select
          label="Unidad"
          id="product-unit"
          value={unit}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setUnit(e.target.value)}
          error={fieldErrors.unit}
        >
          <option value="unit">Unidad</option>
          <option value="ml">Mililitros (ml)</option>
          <option value="gr">Gramos (gr)</option>
          <option value="kg">Kilogramos (kg)</option>
          <option value="lt">Litros (lt)</option>
        </Select>

        <Input
          label="Costo"
          id="product-cost"
          type="number"
          min={0}
          step="0.01"
          value={cost}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setCost(e.target.value)}
          placeholder="Costo por unidad"
          error={fieldErrors.cost_cents}
        />

        <Input
          label="Precio de venta"
          id="product-price"
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)}
          placeholder="Precio sugerido de venta"
          error={fieldErrors.price_cents}
        />

        <div className="md:col-span-2 flex flex-col items-start gap-1 pt-2">
          <Checkbox
            checked={!!isReusable}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setIsReusable(e.target.checked)}
            label="Producto reutilizable (no se consume: tijeras, máquinas, etc.)"
          />
          {fieldErrors.is_reusable && (
            <p className="text-[11px] text-red-300" role="alert">
              {fieldErrors.is_reusable}
            </p>
          )}
        </div>

        <div className="md:col-span-2 mt-2 flex items-center justify-end gap-2">
          <Button type="button" variant="subtle" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
