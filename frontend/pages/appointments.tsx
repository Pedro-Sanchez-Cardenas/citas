import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { FormEvent, ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  type CreateAppointmentPayload,
} from '@/lib/api/appointments';
import { fetchProfessionals } from '@/lib/api/professionals';
import { fetchServices } from '@/lib/api/services';
import { fetchBranches } from '@/lib/api/branches';
import { extractFieldErrors, type FormFieldErrors } from '@/lib/formErrors';
import { formatDateTime } from '@/lib/format';
import { Button, Input, Textarea, Select, Checkbox, Modal, Table, FloatMenu, DatePicker } from '@/components/ui';
import type { Appointment, Professional, Service, Branch } from '@/types';
import type { AxiosError } from 'axios';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Agendada' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'attended', label: 'Atendida' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'no_show', label: 'No se presentó' },
];

interface AppointmentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateAppointmentPayload) => Promise<void>;
  initialData: Appointment | null;
  loading: boolean;
  branches: Branch[];
  professionals: Professional[];
  services: Service[];
  fieldErrors: FormFieldErrors;
}

function AppointmentFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
  branches,
  professionals,
  services,
  fieldErrors,
}: AppointmentFormModalProps) {
  const [branchId, setBranchId] = useState<string | number>(initialData?.branch_id ?? '');
  const [professionalId, setProfessionalId] = useState<string | number>(initialData?.professional_id ?? '');
  const [serviceId, setServiceId] = useState<string | number>(initialData?.service_id ?? '');
  const [clientName, setClientName] = useState(initialData?.client_name ?? '');
  const [clientPhone, setClientPhone] = useState(initialData?.client_phone ?? '');
  const [clientEmail, setClientEmail] = useState(initialData?.client_email ?? '');
  const [startAt, setStartAt] = useState(
    initialData?.start_at
      ? initialData.start_at.slice(0, 16)
      : ''
  );
  const [endAt, setEndAt] = useState(
    initialData?.end_at
      ? initialData.end_at.slice(0, 16)
      : ''
  );
  const [status, setStatus] = useState(initialData?.status ?? 'scheduled');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [notifyClient, setNotifyClient] = useState(false);

  useEffect(() => {
    if (open) {
      const defaultBranch =
        initialData?.branch_id ??
        (branches.length === 1 ? branches[0].id : '');
      setBranchId(defaultBranch);
      setProfessionalId(initialData?.professional_id ?? '');
      setServiceId(initialData?.service_id ?? '');
      setClientName(initialData?.client_name ?? '');
      setClientPhone(initialData?.client_phone ?? '');
      setClientEmail(initialData?.client_email ?? '');
      setStartAt(
        initialData?.start_at ? initialData.start_at.slice(0, 16) : ''
      );
      setEndAt(initialData?.end_at ? initialData.end_at.slice(0, 16) : '');
      setStatus(initialData?.status ?? 'scheduled');
      setNotes(initialData?.notes ?? '');
      setNotifyClient(false);
    }
  }, [open, initialData, branches]);

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
  }, [open, professionalId, serviceId, filteredProfessionals, filteredServices]);

  const isEdit = !!initialData?.id;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: CreateAppointmentPayload = {
      branch_id: Number(branchId),
      professional_id: Number(professionalId),
      service_id: serviceId ? Number(serviceId) : null,
      client_name: clientName,
      client_phone: clientPhone || null,
      client_email: clientEmail || null,
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
        >
          <option value="">Sin servicio asignado</option>
          {filteredServices.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>

        <div className="md:col-span-2">
          <Input
            label="Nombre del cliente"
            id="appointment-client-name"
            required
            value={clientName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setClientName(e.target.value)}
            placeholder="Nombre del cliente"
            error={fieldErrors.client_name}
          />
        </div>

        <Input
          label="Teléfono"
          id="appointment-client-phone"
          value={clientPhone}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setClientPhone(e.target.value)}
          placeholder="+52 ..."
          error={fieldErrors.client_phone}
        />

        <Input
          label="Correo electrónico"
          id="appointment-client-email"
          type="email"
          value={clientEmail}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setClientEmail(e.target.value)}
          placeholder="cliente@correo.com"
          error={fieldErrors.client_email}
        />

        <DatePicker
          label="Inicio"
          id="appointment-start-at"
          enableTime
          required
          value={startAt || null}
          onChange={(_, dateStr) => setStartAt(dateStr || '')}
          error={fieldErrors.start_at}
        />

        <DatePicker
          label="Fin"
          id="appointment-end-at"
          enableTime
          required
          value={endAt || null}
          onChange={(_, dateStr) => setEndAt(dateStr || '')}
          error={fieldErrors.end_at}
        />

        <Select
          label="Estado"
          id="appointment-status"
          value={status}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}
          error={fieldErrors.status}
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
        />

        <div className="md:col-span-2 flex items-center justify-between pt-2">
          <Checkbox
            checked={notifyClient}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNotifyClient(e.target.checked)}
            label="(Futuro) Notificar al cliente por SMS/email al crear o actualizar"
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
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cita'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AppointmentsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
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
        const [appointmentsData, branchesData, professionalsData, servicesData] =
          await Promise.all([
            fetchAppointments(),
            fetchBranches(),
            fetchProfessionals(),
            fetchServices(),
          ]);
        if (!cancelled) {
          setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
          setBranches(Array.isArray(branchesData) ? branchesData : []);
          setProfessionals(
            Array.isArray(professionalsData) ? professionalsData : []
          );
          setServices(Array.isArray(servicesData) ? servicesData : []);
        }
      } catch (err) {
        if (!cancelled) {
          const ax = err as AxiosError<{ message?: string }>;
          setError(
            ax?.response?.data?.message ||
              'No se pudieron cargar las citas.'
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

  const serviceById = useMemo(() => {
    const map = new Map<number, Service>();
    services.forEach((s) => map.set(s.id, s));
    return map;
  }, [services]);

  const filteredAppointments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return appointments.filter((appt) => {
      if (statusFilter && appt.status !== statusFilter) return false;
      if (!q) return true;
      const clientName = String(appt.client_name ?? '').toLowerCase();
      const clientPhone = String(appt.client_phone ?? '').toLowerCase();
      const clientEmail = String(appt.client_email ?? '').toLowerCase();
      return (
        clientName.includes(q) ||
        clientPhone.includes(q) ||
        clientEmail.includes(q)
      );
    });
  }, [appointments, search, statusFilter]);

  const isLoading = authLoading || loading;

  const openCreateModal = () => {
    setFieldErrors({});
    setSelectedAppointment(null);
    setModalOpen(true);
  };

  const openEditModal = (appt: Appointment) => {
    setFieldErrors({});
    setSelectedAppointment(appt);
    setModalOpen(true);
  };

  const handleSubmitAppointment = async (formData: CreateAppointmentPayload) => {
    setModalLoading(true);
    setError('');
    setFieldErrors({});
    try {
      if (selectedAppointment?.id) {
        const updated = await updateAppointment(selectedAppointment.id, formData);
        setAppointments((prev) =>
          prev.map((a) => (a.id === selectedAppointment.id ? updated ?? a : a))
        );
      } else {
        const created = await createAppointment(formData);
        if (created) setAppointments((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setSelectedAppointment(null);
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
          'No se pudo guardar la cita. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteAppointment = async (id: number) => {
    if (!window.confirm('¿Eliminar esta cita? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeletingId(id);
    setError('');
    try {
      await deleteAppointment(id);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
          'No se pudo eliminar la cita. Inténtalo nuevamente.'
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
      <AppointmentFormModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setFieldErrors({});
            setModalOpen(false);
            setSelectedAppointment(null);
          }
        }}
        onSubmit={handleSubmitAppointment}
        initialData={selectedAppointment}
        loading={modalLoading}
        branches={branches}
        professionals={professionals}
        services={services}
        fieldErrors={fieldErrors}
      />

      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Citas
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Controla todas las citas de tu negocio: estado, horario, profesional asignado y cliente.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal} size="md">
          <span className="mr-2 text-base">＋</span>
          Nueva cita
        </Button>
      </header>

      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] sm:items-center">
        <div className="flex-1">
          <div className="relative">
            <Input
              type="text"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, correo o teléfono del cliente..."
              inputClassName="pl-9 rounded-2xl border-slate-800/80 bg-slate-950/70"
            />
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
              🔍
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 justify-end">
          <Select
            value={statusFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.25)]">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="mt-10 flex items-center justify-center text-sm text-slate-400">
          Cargando citas...
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/60 px-6 py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-xl">
            📅
          </div>
          <h3 className="text-sm font-medium text-slate-100">
            Aún no tienes citas registradas
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            Crea tu primera cita para empezar a organizar el día de tu salón, barbería o spa.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 bg-slate-100 text-slate-900 hover:bg-slate-200 border-transparent"
            onClick={openCreateModal}
          >
            Crear cita
          </Button>
        </div>
      ) : (
        <Table<Appointment>
          columns={[
            { key: 'client', header: 'Cliente' },
            { key: 'professional', header: 'Profesional' },
            { key: 'service', header: 'Servicio' },
            { key: 'schedule', header: 'Horario' },
            { key: 'status', header: 'Estado' },
            { key: 'actions', header: 'Acciones', align: 'right' },
          ]}
          items={filteredAppointments}
          getItemKey={(appt) => appt.id}
          renderCell={(appt, key) => {
            const professional = professionalById.get(appt.professional_id ?? 0);
            const service = serviceById.get(appt.service_id ?? 0);
            const statusDef = STATUS_OPTIONS.find(
              (opt) => opt.value === appt.status
            );

            if (key === 'client') {
              return (
                <div className="space-y-0.5">
                  <div className="text-sm font-medium text-slate-50">
                    {appt.client_name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {appt.client_phone || appt.client_email || '—'}
                  </div>
                </div>
              );
            }

            if (key === 'professional') {
              return (
                <span className="text-xs text-slate-400">
                  {professional?.name ?? '—'}
                </span>
              );
            }

            if (key === 'service') {
              return (
                <span className="text-xs text-slate-400">
                  {service?.name ?? '—'}
                </span>
              );
            }

            if (key === 'schedule') {
              return (
                <div className="space-y-0.5 text-xs text-slate-400">
                  <div>{formatDateTime(appt.start_at)}</div>
                  <div className="text-slate-500">
                    {formatDateTime(appt.end_at)}
                  </div>
                </div>
              );
            }

            if (key === 'status') {
              const isCancelled =
                appt.status === 'cancelled' || appt.status === 'no_show';
              const isAttended = appt.status === 'attended';
              const isConfirmed = appt.status === 'confirmed';

              return (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                    isCancelled
                      ? 'bg-red-500/15 text-red-200 border border-red-500/40'
                      : isAttended
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                      : isConfirmed
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40'
                      : 'bg-slate-800/80 text-slate-300 border border-slate-700/80'
                  }`}
                >
                  <span
                    className={`mr-1 h-1.5 w-1.5 rounded-full ${
                      isCancelled
                        ? 'bg-red-400'
                        : isAttended
                        ? 'bg-emerald-400'
                        : isConfirmed
                        ? 'bg-sky-400'
                        : 'bg-slate-500'
                    }`}
                  />
                  {statusDef?.label ?? 'Sin estado'}
                </span>
              );
            }

            if (key === 'actions') {
              return (
                <div className="flex justify-end">
                  <FloatMenu
                    placement="bottom-end"
                    options={[
                      { label: 'Editar', onClick: () => openEditModal(appt) },
                      { divider: true },
                      {
                        label: deletingId === appt.id ? 'Eliminando...' : 'Eliminar',
                        onClick: () => handleDeleteAppointment(appt.id),
                        disabled: deletingId === appt.id,
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
