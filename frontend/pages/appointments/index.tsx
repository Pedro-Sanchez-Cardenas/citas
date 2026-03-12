import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { ChangeEvent } from 'react';
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
import { Button, Input, Select, Table, FloatMenu } from '@/components/ui';
import { AppointmentFormModal, STATUS_OPTIONS } from '@/components/appointments';
import type { Appointment, Branch, Professional, Service } from '@/types';
import type { AxiosError } from 'axios';

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
          setProfessionals(Array.isArray(professionalsData) ? professionalsData : []);
          setServices(Array.isArray(servicesData) ? servicesData : []);
        }
      } catch (err) {
        if (!cancelled) {
          const ax = err as AxiosError<{ message?: string }>;
          setError(
            ax?.response?.data?.message || 'No se pudieron cargar las citas.'
          );
          if (ax?.response?.status === 401) logout();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
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

  if (!authLoading && !user) return null;

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
        <div className="flex items-center justify-end gap-3">
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
            className="mt-4 border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200"
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
            const statusDef = STATUS_OPTIONS.find((opt) => opt.value === appt.status);

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
                  <div className="text-slate-500">{formatDateTime(appt.end_at)}</div>
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
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
                    isCancelled
                      ? 'border-red-500/40 bg-red-500/15 text-red-200'
                      : isAttended
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                      : isConfirmed
                      ? 'border-sky-500/40 bg-sky-500/15 text-sky-300'
                      : 'border-slate-700/80 bg-slate-800/80 text-slate-300'
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-slate-200"
                      aria-label="Acciones"
                    >
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
