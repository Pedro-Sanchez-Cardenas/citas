import { useEffect, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { Button, Input, Select, Modal } from '@/components/ui';
import type { FormFieldErrors } from '@/lib/formErrors';
import type { StockRow, AdjustPayload } from './types';

export interface InventoryAdjustModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: AdjustPayload) => Promise<void>;
  initialData: StockRow | null;
  loading: boolean;
  fieldErrors: FormFieldErrors;
}

export function InventoryAdjustModal({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
  fieldErrors,
}: InventoryAdjustModalProps) {
  const [quantity, setQuantity] = useState('');
  const [type, setType] = useState('in');
  const [reason, setReason] = useState('ajuste');

  useEffect(() => {
    if (open) {
      setQuantity('');
      setType('in');
      setReason('ajuste');
    }
  }, [open, initialData]);

  if (!initialData) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: AdjustPayload = {
      product_id: initialData.product_id,
      branch_id: initialData.branch_id,
      type,
      quantity: Number(quantity),
      reason,
    };
    void onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajustar stock"
      description={`Ajusta el stock de ${initialData.product_name} en ${initialData.branch_name}.`}
      size="md"
    >
      <form className="mt-1 space-y-4" onSubmit={handleSubmit}>
        <Select
          label="Tipo de movimiento"
          id="inventory-type"
          value={type}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setType(e.target.value)}
          error={fieldErrors.type}
        >
          <option value="in">Entrada (+)</option>
          <option value="out">Salida (-)</option>
        </Select>

        <Input
          label="Cantidad"
          id="inventory-quantity"
          type="number"
          min={0}
          step="0.001"
          required
          value={quantity}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value)}
          placeholder="Ej. 1, 0.5, 250"
          error={fieldErrors.quantity}
        />

        <Input
          label="Motivo"
          id="inventory-reason"
          value={reason}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setReason(e.target.value)}
          placeholder="Compra, ajuste, consumo interno, etc."
          error={fieldErrors.reason}
        />

        <div className="form-divider mt-2 flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="subtle" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Aplicando...' : 'Aplicar ajuste'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
