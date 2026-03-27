import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { fetchBranches } from '@/lib/api/branches';
import {
  createAppointment,
  updateAppointment,
  type CreateAppointmentPayload,
} from '@/lib/api/appointments';
import { fetchClients } from '@/lib/api/clients';
import { fetchProfessionals } from '@/lib/api/professionals';
import { fetchServices } from '@/lib/api/services';
import { extractFieldErrors, type FormFieldErrors } from '@/lib/formErrors';
import {
  PageHeader,
  Select,
  Checkbox,
  AppointmentCalendar,
} from '@/components/ui';
import { hasAnyRole } from '@/lib/auth';
import { AppointmentFormModal } from '@/components/appointments';
import type { Appointment, Branch, Client, Professional, Service } from '@/types';
import type { AppointmentCalendarEvent } from '@/components/ui/AppointmentCalendar';

export default function AgendaPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [workerScope, setWorkerScope] = useState<'mine' | 'branch'>('mine');
  const [showCancelled, setShowCancelled] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [initialAppointment, setInitialAppointment] = useState<Appointment | null>(null);
  const [calendarKey, setCalendarKey] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function loadBranches() {
      try {
        const response = await fetchBranches();
        if (!cancelled) {
          const list = Array.isArray(response) ? response : [];
          setBranches(list);
          if (list.length === 1) setSelectedBranchId(String(list[0].id));
        }
      } catch {
        // Sin selector la agenda sigue funcionando
      }
    }
    void loadBranches();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function loadProfessionalsServicesAndClients() {
      try {
        const [profs, svcs, clis] = await Promise.all([
          fetchProfessionals(),
          fetchServices(),
          fetchClients(),
        ]);
        if (!cancelled) {
          setProfessionals(Array.isArray(profs) ? profs : []);
          setServices(Array.isArray(svcs) ? svcs : []);
          setClients(Array.isArray(clis) ? clis : []);
        }
      } catch {
        // Los selects quedarán vacíos si falla
      }
    }
    void loadProfessionalsServicesAndClients();
    return () => { cancelled = true; };
  }, [user]);

  const buildInitialFromEvent = (event: AppointmentCalendarEvent): Appointment => {
    return {
      id: event.id,
      branch_id: event.branch_id ?? undefined,
      professional_id: event.professional_id ?? undefined,
      service_id: event.service_id ?? undefined,
      client_id: event.client_id ?? undefined,
      client: event.client_name
        ? { id: event.client_id ?? 0, name: event.client_name, phone: null, email: null }
        : null,
      start_at: event.start_at,
      end_at: event.end_at,
      status: event.status ?? 'scheduled',
      notes: (event as { notes?: string | null }).notes ?? null,
      professional: null,
      service: null,
    } as Appointment;
  };

  const buildInitialFromDate = (date: Date): Appointment => {
    const start = new Date(date);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const base: Appointment = {
      id: 0,
      branch_id: selectedBranchId
        ? Number(selectedBranchId)
        : user &&
            typeof (user as unknown as { professional_branch_id?: number }).professional_branch_id ===
              'number'
          ? (user as unknown as { professional_branch_id: number }).professional_branch_id
          : undefined,
      professional_id:
        user && typeof (user as unknown as { professional_id?: number }).professional_id === 'number'
          ? (user as unknown as { professional_id: number }).professional_id
          : undefined,
      service_id: undefined,
      client_id: undefined,
      client: null,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      status: 'scheduled',
      notes: null,
      professional: null,
      service: null,
    };
    return base;
  };

  const openCreateFromDate = (date: Date) => {
    setFieldErrors({});
    setInitialAppointment(buildInitialFromDate(date));
    setModalOpen(true);
  };

  const handleEventClick = (event: AppointmentCalendarEvent) => {
    setFieldErrors({});
    setInitialAppointment(buildInitialFromEvent(event));
    setModalOpen(true);
  };

  const handleSubmitAppointment = async (payload: CreateAppointmentPayload) => {
    setModalLoading(true);
    setFieldErrors({});
    try {
      if (initialAppointment?.id) {
        await updateAppointment(initialAppointment.id, payload);
      } else {
        await createAppointment(payload);
      }
      setModalOpen(false);
      setInitialAppointment(null);
      setCalendarKey((prev) => prev + 1);
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
    } finally {
      setModalLoading(false);
    }
  };

  if (!authLoading && !user) return null;

  const isOwner = hasAnyRole(user, ['business_owner', 'manager']);
  const isWorker = hasAnyRole(user, ['worker']);
  const workerBranchId =
    user &&
    typeof (user as unknown as { professional_branch_id?: number }).professional_branch_id ===
      'number'
      ? (user as unknown as { professional_branch_id: number }).professional_branch_id
      : null;

  const workerProfessionalId =
    user &&
    typeof (user as unknown as { professional_id?: number }).professional_id === 'number'
      ? (user as unknown as { professional_id: number }).professional_id
      : null;

  return (
    <>
      <AppointmentFormModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setFieldErrors({});
            setModalOpen(false);
            setInitialAppointment(null);
          }
        }}
        onSubmit={handleSubmitAppointment}
        initialData={initialAppointment}
        loading={modalLoading}
        branches={branches}
        professionals={professionals}
        services={services}
        clients={clients}
        fieldErrors={fieldErrors}
        readOnly={
          isWorker &&
          !!initialAppointment?.id &&
          initialAppointment.professional_id !== workerProfessionalId
        }
        professionalIdLocked={isWorker && workerScope === 'mine' ? workerProfessionalId : null}
        branchIdLocked={isWorker ? workerBranchId : null}
      />

      <PageHeader
        title="Agenda"
        subtitle="Visualiza y gestiona citas: haz clic en un hueco para crear una cita o en un evento para editarlo."
      />

      <div className="surface-inset mb-4 flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        {isOwner && branches.length > 0 && (
          <div className="w-full sm:max-w-xs">
            <Select
              id="agenda-branch"
              label="Sucursal"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
            >
              <option value="">Todas las sucursales</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </Select>
          </div>
        )}
        {isWorker && workerBranchId != null && (
          <div className="w-full sm:max-w-xs">
            <Select
              id="agenda-worker-scope"
              label="Vista"
              value={workerScope}
              onChange={(e) => setWorkerScope(e.target.value as 'mine' | 'branch')}
            >
              <option value="mine">Mis citas</option>
              <option value="branch">Toda la sucursal</option>
            </Select>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
          <Checkbox
            id="agenda-show-cancelled"
            checked={showCancelled}
            onChange={(e) => setShowCancelled(e.target.checked)}
            label="Incluir canceladas y no presentados"
          />
        </div>
      </div>

      <p className="mb-3 text-xs text-slate-500">
        Tip: arrastra o navega en el calendario para cambiar de rango y mantener el contexto de trabajo.
      </p>

      <AppointmentCalendar
        key={calendarKey}
        user={user}
        branchId={isOwner ? selectedBranchId || null : workerBranchId}
        workerScope={isWorker ? workerScope : undefined}
        showCancelled={showCancelled}
        onEventClick={handleEventClick}
        onDateClick={openCreateFromDate}
        initialView="timeGridWeek"
        height="calc(100vh - 16rem)"
        className="mt-2"
      />
    </>
  );
}
