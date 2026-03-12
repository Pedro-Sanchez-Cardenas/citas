import { useEffect, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { Button, Input, Select, Modal, Textarea, DatePicker } from '@/components/ui';
import type { FormFieldErrors } from '@/lib/formErrors';
import type { CreateBlockPayload } from '@/lib/api/blocks';
import type { Professional } from '@/types';

export interface BlockFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateBlockPayload) => Promise<void>;
  loading: boolean;
  professionals: Professional[];
  fieldErrors: FormFieldErrors;
}

export function BlockFormModal({
  open,
  onClose,
  onSubmit,
  loading,
  professionals,
  fieldErrors,
}: BlockFormModalProps) {
  const [professionalId, setProfessionalId] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState('block');

  useEffect(() => {
    if (open) {
      setProfessionalId('');
      setStartAt('');
      setEndAt('');
      setReason('');
      setType('block');
    }
  }, [open]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: CreateBlockPayload = {
      professional_id: professionalId ? Number(professionalId) : null,
      start_at: startAt ? new Date(startAt).toISOString() : '',
      end_at: endAt ? new Date(endAt).toISOString() : '',
      reason: reason || null,
      type: type || null,
    };
    void onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bloquear horario"
      description="Crea un bloqueo de tiempo en la agenda (descanso, mantenimiento, evento interno, etc.)."
      size="md"
    >
      <form className="mt-1 space-y-4" onSubmit={handleSubmit}>
        <Select
          label="Profesional (opcional)"
          id="block-professional"
          value={professionalId}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setProfessionalId(e.target.value)}
          error={fieldErrors.professional_id}
        >
          <option value="">Bloqueo general</option>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>

        <DatePicker
          label="Inicio"
          id="block-start-at"
          enableTime
          required
          value={startAt || null}
          onChange={(_, dateStr) => setStartAt(dateStr || '')}
          error={fieldErrors.start_at}
        />

        <DatePicker
          label="Fin"
          id="block-end-at"
          enableTime
          required
          value={endAt || null}
          onChange={(_, dateStr) => setEndAt(dateStr || '')}
          error={fieldErrors.end_at}
        />

        <Input
          label="Tipo"
          id="block-type"
          value={type}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setType(e.target.value)}
          placeholder="descanso, mantenimiento, cierre, etc."
          error={fieldErrors.type}
        />

        <Textarea
          label="Motivo"
          id="block-reason"
          rows={3}
          value={reason}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
          placeholder="Detalles del motivo del bloqueo."
          error={fieldErrors.reason}
        />

        <div className="mt-2 flex items-center justify-end gap-2">
          <Button type="button" variant="subtle" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Guardando...' : 'Crear bloqueo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
