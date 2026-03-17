import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Button, Input, Modal } from '@/components/ui';
import type { FormFieldErrors } from '@/lib/formErrors';
import type { Branch } from '@/types';

export interface BranchFormPayload {
  name: string;
  code: string;
  timezone?: string;
  address_line_1?: string | null;
  city?: string | null;
  country?: string | null;
}

export interface BranchFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: BranchFormPayload) => Promise<void>;
  initialData: (Branch & Partial<BranchFormPayload>) | null;
  loading: boolean;
  fieldErrors: FormFieldErrors;
}

export function BranchFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
  fieldErrors,
}: BranchFormModalProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [code, setCode] = useState(
    (initialData as BranchFormPayload | null)?.code ?? ''
  );
  const [timezone, setTimezone] = useState(
    (initialData as BranchFormPayload | null)?.timezone ?? 'UTC'
  );
  const [address1, setAddress1] = useState(
    (initialData as BranchFormPayload | null)?.address_line_1 ?? ''
  );
  const [city, setCity] = useState(
    (initialData as BranchFormPayload | null)?.city ?? ''
  );
  const [country, setCountry] = useState(
    (initialData as BranchFormPayload | null)?.country ?? ''
  );

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '');
      setCode((initialData as BranchFormPayload | null)?.code ?? '');
      setTimezone((initialData as BranchFormPayload | null)?.timezone ?? 'UTC');
      setAddress1((initialData as BranchFormPayload | null)?.address_line_1 ?? '');
      setCity((initialData as BranchFormPayload | null)?.city ?? '');
      setCountry((initialData as BranchFormPayload | null)?.country ?? '');
    }
  }, [open, initialData]);

  const isEdit = !!initialData?.id;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: BranchFormPayload = {
      name: name.trim(),
      code: code.trim(),
      timezone: timezone || 'UTC',
      address_line_1: address1 || null,
      city: city || null,
      country: country || null,
    };
    void onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar sucursal' : 'Nueva sucursal'}
      description="Configura la sucursal donde atiendes a tus clientes."
      size="md"
    >
      <form className="mt-1 space-y-3" onSubmit={handleSubmit}>
        <Input
          label="Nombre de la sucursal"
          id="branch-name"
          required
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          error={fieldErrors.name}
          placeholder="Sucursal principal, Centro, Norte..."
        />
        <div>
          <Input
            label="Código interno"
            id="branch-code"
            required
            value={code}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
            error={fieldErrors.code}
            placeholder="BR-001"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Se usa como identificador interno único.
          </p>
        </div>
        <Input
          label="Zona horaria"
          id="branch-timezone"
          value={timezone}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTimezone(e.target.value)}
          error={fieldErrors.timezone}
          placeholder="America/Mexico_City, UTC, etc."
        />
        <Input
          label="Dirección (opcional)"
          id="branch-address1"
          value={address1}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setAddress1(e.target.value)}
          error={fieldErrors.address_line_1}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Ciudad"
            id="branch-city"
            value={city}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCity(e.target.value)}
            error={fieldErrors.city}
          />
          <Input
            label="País"
            id="branch-country"
            value={country}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCountry(e.target.value)}
            error={fieldErrors.country}
          />
        </div>

        <div className="mt-2 flex items-center justify-end gap-2">
          <Button type="button" variant="subtle" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear sucursal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

