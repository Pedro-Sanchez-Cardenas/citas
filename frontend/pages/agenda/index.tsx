import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { fetchBranches } from '@/lib/api/branches';
import {
  createAppointment,
  updateAppointment,
  type CreateAppointmentPayload,
} from '@/lib/api/appointments';
import { extractFieldErrors, type FormFieldErrors } from '@/lib/formErrors';
import {
  PageHeader,
  Select,
  Checkbox,
  AppointmentCalendar,
} from '@/components/ui';
import { hasAnyRole } from '@/lib/auth';
import { AppointmentFormModal } from '@/components/appointments';
import type { Appointment, Branch, Professional, Service } from '@/types';
import type { AppointmentCalendarEvent } from '@/components/ui/AppointmentCalendar';

export default function AgendaPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
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

  const buildInitialFromEvent = (event: AppointmentCalendarEvent): Appointment => {
    return {
      id: event.id,
      branch_id: event.branch_id ?? undefined,
      professional_id: event.professional_id ?? undefined,
      service_id: (event as any).service_id ?? undefined,
      client_name: event.client_name ?? '',
      client_phone: (event as any).client_phone ?? null,
      client_email: (event as any).client_email ?? null,
      start_at: event.start_at,
      end_at: event.end_at,
      status: event.status ?? 'scheduled',
      notes: (event as any).notes ?? null,
      professional: null,
      service: null,
    } as Appointment;
  };

  const buildInitialFromDate = (date: Date): Appointment => {
    const start = new Date(date);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const base: Appointment = {
      id: 0,
      branch_id: selectedBranchId ? Number(selectedBranchId) : undefined,
      professional_id:
        user && typeof (user as any).professional_id === 'number'
          ? (user as any).professional_id
          : undefined,
      service_id: undefined,
      client_name: '',
      client_phone: null,
      client_email: null,
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

  const isOwner = hasAnyRole(user, ['business_owner']);

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
        professionals={[] as Professional[]}
        services={[] as Service[]}
        fieldErrors={fieldErrors}
      />

      <PageHeader
        title="Agenda"
        subtitle="Crea y gestiona todas tus citas desde una vista de calendario elegante y responsiva."
      />

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {isOwner && branches.length > 0 && (
          <div className="w-full sm:w-56">
            <Select
              id="agenda-branch"
              label={null}
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              selectClassName="rounded-xl border-[var(--color-border)] bg-surface-elevated/60"
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
        <div className="flex items-center gap-3">
          <Checkbox
            id="agenda-show-cancelled"
            checked={showCancelled}
            onChange={(e) => setShowCancelled(e.target.checked)}
            label="Mostrar canceladas / no presentados"
          />
        </div>
      </div>

      <AppointmentCalendar
        key={calendarKey}
        user={user}
        branchId={selectedBranchId || null}
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
