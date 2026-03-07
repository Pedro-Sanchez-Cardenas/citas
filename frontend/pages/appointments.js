import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from '@/lib/api/appointments';
import { fetchProfessionals } from '@/lib/api/professionals';
import { fetchServices } from '@/lib/api/services';
import { Button, Input, Textarea, Select, Checkbox, Modal, Table, FloatMenu } from '@/components/ui';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Agendada' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'attended', label: 'Atendida' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'no_show', label: 'No se presentó' },
];

function formatDateTime(value) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  } catch {
    return value;
  }
}

function AppointmentFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
  professionals,
  services,
}) {
  const [professionalId, setProfessionalId] = useState(
    initialData?.professional_id ?? ''
  );
  const [serviceId, setServiceId] = useState(initialData?.service_id ?? '');
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
  }, [open, initialData]);

  const isEdit = !!initialData?.id;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      professional_id: Number(professionalId),
      service_id: serviceId ? Number(serviceId) : null,
      client_name: clientName,
      client_phone: clientPhone || null,
      client_email: clientEmail || null,
      start_at: startAt ? new Date(startAt).toISOString() : null,
      end_at: endAt ? new Date(endAt).toISOString() : null,
      status: status || null,
      notes: notes || null,
      // podrías enviar notifyClient como flag a futuro si lo soportas en backend
    };
    onSubmit(payload);
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
          label="Profesional"
          id="appointment-professional"
          value={professionalId}
          onChange={(e) => setProfessionalId(e.target.value)}
          required
        >
          <option value="">Selecciona profesional</option>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>

        <Select
          label="Servicio"
          id="appointment-service"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
        >
          <option value="">Sin servicio asignado</option>
          {services.map((s) => (
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
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Nombre del cliente"
          />
        </div>

        <Input
          label="Teléfono"
          id="appointment-client-phone"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
          placeholder="+52 ..."
        />

        <Input
          label="Correo electrónico"
          id="appointment-client-email"
          type="email"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          placeholder="cliente@correo.com"
        />

        <Input
          label="Inicio"
          id="appointment-start-at"
          type="datetime-local"
          required
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
        />

        <Input
          label="Fin"
          id="appointment-end-at"
          type="datetime-local"
          required
          value={endAt}
          onChange={(e) => setEndAt(e.target.value)}
        />

        <Select
          label="Estado"
          id="appointment-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
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
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Detalles específicos de la cita, preferencias del cliente, etc."
        />

        <div className="md:col-span-2 flex items-center justify-between pt-2">
          <Checkbox
            checked={notifyClient}
            onChange={(e) => setNotifyClient(e.target.checked)}
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

  const [appointments, setAppointments] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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
        const [appointmentsData, professionalsData, servicesData] =
          await Promise.all([
            fetchAppointments(),
            fetchProfessionals(),
            fetchServices(),
          ]);
        if (!cancelled) {
          setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
          setProfessionals(
            Array.isArray(professionalsData) ? professionalsData : []
          );
          setServices(Array.isArray(servicesData) ? servicesData : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              'No se pudieron cargar las citas.'
          );
          if (err?.response?.status === 401) {
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
    const map = new Map();
    professionals.forEach((p) => map.set(p.id, p));
    return map;
  }, [professionals]);

  const serviceById = useMemo(() => {
    const map = new Map();
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
    setSelectedAppointment(null);
    setModalOpen(true);
  };

  const openEditModal = (appt) => {
    setSelectedAppointment(appt);
    setModalOpen(true);
  };

  const handleSubmitAppointment = async (formData) => {
    setModalLoading(true);
    setError('');
    try {
      if (selectedAppointment?.id) {
        const updated = await updateAppointment(selectedAppointment.id, formData);
        setAppointments((prev) =>
          prev.map((a) => (a.id === selectedAppointment.id ? updated ?? a : a))
        );
      } else {
        const created = await createAppointment(formData);
        setAppointments((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setSelectedAppointment(null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'No se pudo guardar la cita. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm('¿Eliminar esta cita? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeletingId(id);
    setError('');
    try {
      await deleteAppointment(id);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
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
    <DashboardLayout user={user} onLogout={logout}>
      <AppointmentFormModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setModalOpen(false);
            setSelectedAppointment(null);
          }
        }}
        onSubmit={handleSubmitAppointment}
        initialData={selectedAppointment}
        loading={modalLoading}
        professionals={professionals}
        services={services}
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
              onChange={(e) => setSearch(e.target.value)}
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
            onChange={(e) => setStatusFilter(e.target.value)}
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
        <Table
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
            const professional = professionalById.get(appt.professional_id);
            const service = serviceById.get(appt.service_id);
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
    </DashboardLayout>
  );
}

