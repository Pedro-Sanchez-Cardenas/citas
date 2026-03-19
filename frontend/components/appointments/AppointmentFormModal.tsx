import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import {
  Button,
  Select,
  Checkbox,
  Modal,
  Textarea,
  DatePicker,
} from '@/components/ui';
import type { FormFieldErrors } from '@/lib/formErrors';
import type { CreateAppointmentPayload } from '@/lib/api/appointments';
import type { Appointment, Branch, Client, Professional, Service } from '@/types';
import { STATUS_OPTIONS } from './utils';

export interface AppointmentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateAppointmentPayload) => Promise<void>;
  initialData: Appointment | null;
  loading: boolean;
  branches: Branch[];
  professionals: Professional[];
  services: Service[];
  clients: Client[];
  fieldErrors: FormFieldErrors;
  readOnly?: boolean;
  professionalIdLocked?: number | null;
  branchIdLocked?: number | null;
}

export function AppointmentFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
  branches,
  professionals,
  services,
  clients,
  fieldErrors,
  readOnly = false,
  professionalIdLocked = null,
  branchIdLocked = null,
}: AppointmentFormModalProps) {
  const [branchId, setBranchId] = useState<string | number>(initialData?.branch_id ?? '');
  const [professionalId, setProfessionalId] = useState<string | number>(initialData?.professional_id ?? '');
  const [serviceId, setServiceId] = useState<string | number>(initialData?.service_id ?? '');
  const [clientId, setClientId] = useState<string | number>(initialData?.client_id ?? initialData?.client?.id ?? '');
  const [startAt, setStartAt] = useState(
    initialData?.start_at ? initialData.start_at.slice(0, 16) : ''
  );
  const [endAt, setEndAt] = useState(
    initialData?.end_at ? initialData.end_at.slice(0, 16) : ''
  );
  const [status, setStatus] = useState(initialData?.status ?? 'scheduled');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [notifyClient, setNotifyClient] = useState(false);

  const isEdit = !!initialData?.id;

  useEffect(() => {
    if (open) {
      const defaultBranch =
        initialData?.branch_id ??
        (branches.length === 1 ? branches[0].id : '');
      setBranchId(defaultBranch);
      setProfessionalId(initialData?.professional_id ?? '');
      setServiceId(initialData?.service_id ?? '');
      setClientId(initialData?.client_id ?? initialData?.client?.id ?? '');
      setStartAt(initialData?.start_at ? initialData.start_at.slice(0, 16) : '');
      setEndAt(initialData?.end_at ? initialData.end_at.slice(0, 16) : '');
      setStatus(initialData?.status ?? 'scheduled');
      setNotes(initialData?.notes ?? '');
      setNotifyClient(false);

      // Para workers: al crear, el profesional queda bloqueado a su propio id.
      if (!isEdit && professionalIdLocked != null) {
        setProfessionalId(String(professionalIdLocked));
      }

      // Para workers: al crear, la sucursal queda bloqueada a su sucursal.
      if (!isEdit && branchIdLocked != null) {
        setBranchId(String(branchIdLocked));
      }
    }
  }, [open, initialData, branches, professionalIdLocked, branchIdLocked]);

  const normalizedBranchId =
    branchId !== '' && Number.isFinite(Number(branchId)) ? Number(branchId) : null;

  const filteredProfessionals = useMemo(() => {
    if (!normalizedBranchId) return professionals;
    return professionals.filter(
      (p) => p.branch_id == null || Number(p.branch_id) === normalizedBranchId
    );
  }, [professionals, normalizedBranchId]);

  const filteredServices = useMemo(() => {
    if (!normalizedBranchId) return services;
    return services.filter(
      (s) => s.branch_id == null || Number(s.branch_id) === normalizedBranchId
    );
  }, [services, normalizedBranchId]);

  useEffect(() => {
    if (!open) return;
    if (
      professionalId &&
      !filteredProfessionals.some((p) => p.id === Number(professionalId))
    ) {
      setProfessionalId('');
    }
    if (serviceId && !filteredServices.some((s) => s.id === Number(serviceId))) {
      setServiceId('');
    }
    if (clientId && !clients.some((c) => c.id === Number(clientId))) {
      setClientId('');
    }
  }, [open, professionalId, serviceId, clientId, filteredProfessionals, filteredServices, clients]);

  const isReadOnly = readOnly;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isReadOnly) return;
    const payload: CreateAppointmentPayload = {
      branch_id: Number(branchId),
      professional_id: Number(professionalId),
      service_id: serviceId ? Number(serviceId) : null,
      client_id: clientId ? Number(clientId) : null,
      start_at: startAt ? new Date(startAt).toISOString() : '',
      end_at: endAt ? new Date(endAt).toISOString() : '',
      status: status || null,
      notes: notes || null,
    };
    void onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar cita' : 'Nueva cita'}
      description="Agenda o actualiza una cita con información clara para tu equipo y el cliente."
      size="lg"
    >
      <form
        className="mt-1 grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <Select
          label="Sucursal"
          id="appointment-branch"
          value={String(branchId)}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setBranchId(e.target.value)}
          required
          error={fieldErrors.branch_id}
          disabled={isReadOnly || branchIdLocked != null}
        >
          <option value="">Selecciona sucursal</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>

        <Select
          label="Profesional"
          id="appointment-professional"
          value={String(professionalId)}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setProfessionalId(e.target.value)}
          required
          error={fieldErrors.professional_id}
          disabled={isReadOnly || professionalIdLocked != null}
        >
          <option value="">Selecciona profesional</option>
          {filteredProfessionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>

        <Select
          label="Servicio"
          id="appointment-service"
          value={String(serviceId)}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setServiceId(e.target.value)}
          error={fieldErrors.service_id}
          disabled={isReadOnly}
        >
          <option value="">Sin servicio asignado</option>
          {filteredServices.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>

        <Select
          label="Cliente"
          id="appointment-client"
          value={String(clientId)}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setClientId(e.target.value)}
          error={fieldErrors.client_id}
          disabled={isReadOnly}
        >
          <option value="">Sin cliente / Cliente ocasional</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.phone ? ` · ${c.phone}` : ''}
            </option>
          ))}
        </Select>

        <DatePicker
          label="Inicio"
          id="appointment-start-at"
          enableTime
          required
          value={startAt || null}
          onChange={(_, dateStr) => setStartAt(dateStr || '')}
          error={fieldErrors.start_at}
          disabled={isReadOnly}
        />

        <DatePicker
          label="Fin"
          id="appointment-end-at"
          enableTime
          required
          value={endAt || null}
          onChange={(_, dateStr) => setEndAt(dateStr || '')}
          error={fieldErrors.end_at}
          disabled={isReadOnly}
        />

        <Select
          label="Estado"
          id="appointment-status"
          value={status}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}
          error={fieldErrors.status}
          disabled={isReadOnly}
        >
          <option value="">Sin estado</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>

        <Textarea
          label="Notas internas"
          id="appointment-notes"
          rows={3}
          value={notes}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
          placeholder="Detalles específicos de la cita, preferencias del cliente, etc."
          error={fieldErrors.notes}
          disabled={isReadOnly}
        />

        <div className="flex items-center justify-between pt-2 md:col-span-2">
          <Checkbox
            checked={notifyClient}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNotifyClient(e.target.checked)}
            label="(Futuro) Notificar al cliente por SMS/email al crear o actualizar"
            disabled={isReadOnly}
          />
        </div>

        <div className="mt-2 flex items-center justify-end gap-2 md:col-span-2">
          <Button type="button" variant="subtle" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={loading || isReadOnly}
          >
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cita'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
