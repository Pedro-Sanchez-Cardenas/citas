'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { DatesSetArg, EventClickArg, EventContentArg, DateSelectArg } from '@fullcalendar/core';
import { fetchAgendaRange } from '@/lib/api/agenda';
import { fetchWorkingHours, type WorkingHour } from '@/components/working-hours/api/workingHours';
import { hasAnyRole } from '@/lib/auth';
import type { User } from '@/types';

/** Intervalo de tiempo en formato "HH:mm". */
type TimeInterval = { start: string; end: string };

/** Agrupa y fusiona intervalos por día de la semana (0=Dom … 6=Sáb). */
function buildWorkingIntervalsByWeekday(hours: WorkingHour[]): Map<number, TimeInterval[]> {
  const byWeekday = new Map<number, TimeInterval[]>();
  hours
    .filter((h) => h.is_active !== false && h.weekday != null && h.start_time && h.end_time)
    .forEach((h) => {
      const w = Number(h.weekday);
      const start = String(h.start_time).slice(0, 5);
      const end = String(h.end_time).slice(0, 5);
      if (!byWeekday.has(w)) byWeekday.set(w, []);
      byWeekday.get(w)!.push({ start, end });
    });
  const result = new Map<number, TimeInterval[]>();
  byWeekday.forEach((intervals, weekday) => {
    intervals.sort((a, b) => a.start.localeCompare(b.start));
    const merged: TimeInterval[] = [];
    for (const inv of intervals) {
      const last = merged[merged.length - 1];
      if (last && inv.start <= last.end) {
        last.end = last.end < inv.end ? inv.end : last.end;
      } else {
        merged.push({ ...inv });
      }
    }
    result.set(weekday, merged);
  });
  return result;
}

/** Convierte intervalos por weekday en businessHours de FullCalendar (daysOfWeek 0=Dom). */
function workingIntervalsToBusinessHours(byWeekday: Map<number, TimeInterval[]>): { daysOfWeek: number[]; startTime: string; endTime: string }[] {
  const list: { daysOfWeek: number[]; startTime: string; endTime: string }[] = [];
  byWeekday.forEach((intervals, weekday) => {
    intervals.forEach((inv) => {
      list.push({
        daysOfWeek: [weekday],
        startTime: inv.start.length === 5 ? inv.start : `${inv.start}:00`.slice(0, 5),
        endTime: inv.end.length === 5 ? inv.end : `${inv.end}:00`.slice(0, 5),
      });
    });
  });
  return list;
}

/** Devuelve slotMinTime y slotMaxTime desde todos los intervalos (formato "HH:mm:ss"). */
function slotRangeFromIntervals(byWeekday: Map<number, TimeInterval[]>): { slotMinTime: string; slotMaxTime: string } {
  let min = '23:59';
  let max = '00:00';
  byWeekday.forEach((intervals) => {
    intervals.forEach((inv) => {
      if (inv.start < min) min = inv.start;
      if (inv.end > max) max = inv.end;
    });
  });
  const toFull = (t: string) => (t.length >= 5 ? `${t.slice(0, 5)}:00` : `${t}:00:00`);
  return {
    slotMinTime: min === '23:59' ? '06:00:00' : toFull(min),
    slotMaxTime: max === '00:00' ? '22:00:00' : toFull(max),
  };
}

/** Comprueba si la selección [start, end] está dentro de algún intervalo del día. */
function isSelectionWithinWorkingHours(
  start: Date,
  end: Date,
  byWeekday: Map<number, TimeInterval[]>
): boolean {
  const weekday = start.getDay();
  const intervals = byWeekday.get(weekday);
  if (!intervals?.length) return false;
  const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
  const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
  return intervals.some((inv) => startTime >= inv.start && endTime <= inv.end);
}

export interface AppointmentCalendarEvent {
  id: number;
  start_at: string;
  end_at: string;
  client_id?: number | null;
  client_name?: string | null;
  professional_name?: string | null;
  service_name?: string | null;
  status?: string | null;
  professional_id?: number | null;
  branch_id?: number | null;
  service_id?: number | null;
  [key: string]: unknown;
}

function normalizeEvent(raw: Record<string, unknown>): AppointmentCalendarEvent {
  const professional = raw.professional as { name?: string } | undefined;
  const service = raw.service as { name?: string } | undefined;
  const client = raw.client as { id?: number; name?: string } | undefined;
  return {
    id: Number(raw.id),
    start_at: String(raw.start_at ?? ''),
    end_at: String(raw.end_at ?? ''),
    client_id: raw.client_id != null ? Number(raw.client_id) : client?.id ?? null,
    client_name: client?.name ?? (raw.client_name as string) ?? null,
    professional_name: professional?.name ?? (raw.professional_name as string) ?? null,
    service_name: service?.name ?? (raw.service_name as string) ?? null,
    status: (raw.status as string) ?? null,
    professional_id: raw.professional_id != null ? Number(raw.professional_id) : null,
    branch_id: raw.branch_id != null ? Number(raw.branch_id) : null,
    service_id: raw.service_id != null ? Number(raw.service_id) : null,
  };
}

function eventStatusStyle(status: string | null | undefined): { bg: string; border: string; label: string } {
  if (status === 'cancelled' || status === 'no_show') {
    return { bg: 'rgba(239, 68, 68, 0.18)', border: 'rgba(239, 68, 68, 0.55)', label: 'Cancelada' };
  }
  if (status === 'attended') {
    return { bg: 'rgba(16, 185, 129, 0.22)', border: 'rgba(16, 185, 129, 0.5)', label: 'Atendida' };
  }
  if (status === 'confirmed') {
    return { bg: 'rgba(14, 165, 233, 0.22)', border: 'rgba(14, 165, 233, 0.5)', label: 'Confirmada' };
  }
  return { bg: 'rgba(20, 184, 166, 0.2)', border: 'rgba(20, 184, 166, 0.5)', label: 'Programada' };
}

function EventContent({ arg }: { arg: EventContentArg }) {
  const ext = arg.event.extendedProps as {
    client_name?: string;
    service_name?: string;
    professional_name?: string;
    status?: string;
  };
  const { border } = eventStatusStyle(ext?.status ?? null);
  return (
    <div
      className="fc-appointment-event"
      style={{
        borderLeft: `3px solid ${border}`,
      }}
    >
      <div className="fc-appointment-event__title">
        {ext?.client_name || arg.event.title || 'Cita'}
      </div>
      <div className="fc-appointment-event__meta">
        {[ext?.service_name, ext?.professional_name].filter(Boolean).join(' · ') || '—'}
      </div>
    </div>
  );
}

export interface AppointmentCalendarProps {
  /** Usuario actual: define si es dueño (ve por branch) o profesional (ve solo las suyas). */
  user: User | null;
  /** Para dueño: filtrar por sucursal. Para worker en modo 'branch': filtra por sucursal. */
  branchId?: number | string | null;
  /** Para worker: 'mine' (predeterminado) o 'branch' para ver panorama del branch. */
  workerScope?: 'mine' | 'branch';
  /** Incluir citas canceladas / no presentado. */
  showCancelled?: boolean;
  /** Callback al cambiar el rango de fechas visibles (para cargar datos). */
  onDatesSet?: (start: Date, end: Date) => void;
  /** Callback al hacer clic en un evento. */
  onEventClick?: (event: AppointmentCalendarEvent) => void;
  /** Callback al hacer clic en una fecha (solo si selectable). */
  onDateClick?: (date: Date) => void;
  /** Vista inicial. */
  initialView?: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth' | 'listWeek';
  /** Altura del calendario (ej: 'auto', 600, '80vh'). */
  height?: string | number;
  /** Clase CSS del contenedor. */
  className?: string;
}

export default function AppointmentCalendar({
  user,
  branchId,
  workerScope = 'mine',
  showCancelled = false,
  onDatesSet,
  onEventClick,
  onDateClick,
  initialView = 'timeGridWeek',
  height = 'auto',
  className = '',
}: AppointmentCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const rangeRef = useRef<{ start: Date; end: Date } | null>(null);
  const [events, setEvents] = useState<AppointmentCalendarEvent[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = hasAnyRole(user, ['business_owner', 'manager']);
  const professionalId = user?.professional_id != null ? Number(user.professional_id) : null;
  const workerBranchId =
    branchId != null && String(branchId) !== '' ? Number(branchId) : null;

  const fetchParams = useCallback(() => {
    if (isOwner) {
      return branchId != null && branchId !== '' ? { branch_id: Number(branchId) } : {};
    }
    if (workerScope === 'branch' && workerBranchId != null) {
      return { branch_id: workerBranchId };
    }

    return professionalId != null ? { professional_id: professionalId } : {};
  }, [isOwner, branchId, professionalId, workerScope, workerBranchId]);

  const loadEvents = useCallback(
    async (start: Date, end: Date) => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const { items } = await fetchAgendaRange(start, end, fetchParams());
        const rawList = Array.isArray(items) ? items : [];
        const normalized = rawList.map((item) => normalizeEvent(item as Record<string, unknown>));
        const filtered = showCancelled
          ? normalized
          : normalized.filter(
              (e) => e.status !== 'cancelled' && e.status !== 'no_show'
            );
        setEvents(filtered);
      } catch (err) {
        setError('No se pudo cargar la agenda.');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    },
    [user, fetchParams, showCancelled]
  );

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      rangeRef.current = { start: arg.start, end: arg.end };
      loadEvents(arg.start, arg.end);
      onDatesSet?.(arg.start, arg.end);
    },
    [loadEvents, onDatesSet]
  );

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      const ext = arg.event.extendedProps as Record<string, unknown>;
      if (ext?.id != null) {
        onEventClick?.({
          ...ext,
          id: Number(ext.id),
          start_at: arg.event.startStr ?? '',
          end_at: arg.event.endStr ?? '',
        } as AppointmentCalendarEvent);
      }
    },
    [onEventClick]
  );

  const fcEvents = events.map((e) => {
    const { bg, border } = eventStatusStyle(e.status ?? null);
    return {
      id: String(e.id),
      title: e.client_name || 'Cita',
      start: e.start_at,
      end: e.end_at,
      backgroundColor: bg,
      borderColor: border,
      extendedProps: {
        ...e,
        client_name: e.client_name,
        service_name: e.service_name,
        professional_name: e.professional_name,
        status: e.status,
      },
    };
  });

  useEffect(() => {
    if (!user) return;
    const r = rangeRef.current;
    if (r) loadEvents(r.start, r.end);
  }, [user, branchId, professionalId, isOwner, showCancelled, loadEvents]);

  useEffect(() => {
    if (!user) return;
    const params = fetchParams();
    fetchWorkingHours(params)
      .then(setWorkingHours)
      .catch(() => setWorkingHours([]));
  }, [user, fetchParams]);

  const workingByWeekday = useMemo(() => buildWorkingIntervalsByWeekday(workingHours), [workingHours]);
  const businessHoursConfig = useMemo(
    () => (workingByWeekday.size > 0 ? workingIntervalsToBusinessHours(workingByWeekday) : undefined),
    [workingByWeekday]
  );
  const { slotMinTime, slotMaxTime } = useMemo(
    () => slotRangeFromIntervals(workingByWeekday),
    [workingByWeekday]
  );
  const selectAllow = useCallback(
    (selectInfo: DateSelectArg) => {
      if (workingByWeekday.size === 0) return true;
      return isSelectionWithinWorkingHours(selectInfo.start, selectInfo.end, workingByWeekday);
    },
    [workingByWeekday]
  );

  return (
    <div className={`appointment-calendar-root ${className}`.trim()}>
      {error && (
        <div className="appointment-calendar-error" role="alert">
          {error}
        </div>
      )}
      <div className="appointment-calendar-wrapper">
        {loading && (
          <div className="appointment-calendar-loading">
            <span className="appointment-calendar-spinner" aria-hidden />
            <span>Cargando agenda...</span>
          </div>
        )}
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={initialView}
          events={fcEvents}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          dateClick={onDateClick ? (arg) => onDateClick(arg.date) : undefined}
          eventContent={(arg) => <EventContent arg={arg} />}
          height={height}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridDay,timeGridWeek,dayGridMonth,listWeek',
          }}
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            list: 'Lista',
          }}
          locale="es"
          firstDay={1}
          slotMinTime={slotMinTime}
          slotMaxTime={slotMaxTime}
          slotDuration="00:30:00"
          allDaySlot={false}
          nowIndicator
          navLinks
          editable={false}
          selectable={!!onDateClick}
          selectAllow={onDateClick ? selectAllow : undefined}
          businessHours={businessHoursConfig}
          dayMaxEvents={4}
          moreLinkClick="popover"
        />
      </div>
      <style jsx global>{`
        .appointment-calendar-root {
          --fc-border-color: rgba(148, 163, 184, 0.12);
          --fc-button-bg: rgba(2, 6, 23, 0.65);
          --fc-button-border: rgba(255, 255, 255, 0.1);
          --fc-button-hover-bg: rgba(255, 255, 255, 0.08);
          --fc-button-hover-border: rgba(45, 212, 191, 0.45);
          --fc-button-active-bg: rgba(45, 212, 191, 0.18);
          --fc-today-bg: rgba(45, 212, 191, 0.08);
          --fc-page-bg: transparent;
          --fc-list-hover: rgba(45, 212, 191, 0.12);
        }

        .appointment-calendar-error {
          margin-bottom: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-xl);
          border: 1px solid rgba(239, 68, 68, 0.4);
          background: rgba(239, 68, 68, 0.1);
          color: rgb(254, 226, 226);
          font-size: 0.875rem;
        }

        .appointment-calendar-wrapper {
          position: relative;
          border-radius: var(--radius-2xl);
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(2, 6, 23, 0.4);
          backdrop-filter: blur(20px) saturate(160%);
          -webkit-backdrop-filter: blur(20px) saturate(160%);
          box-shadow: var(--shadow-card);
          overflow: hidden;
        }

        .appointment-calendar-loading {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          background: rgba(2, 6, 23, 0.72);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: var(--radius-2xl);
          font-size: 0.875rem;
          color: rgb(148, 163, 184);
        }

        .appointment-calendar-spinner {
          width: 1.5rem;
          height: 1.5rem;
          border: 2px solid var(--color-border);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          animation: appointment-calendar-spin 0.7s linear infinite;
        }

        @keyframes appointment-calendar-spin {
          to { transform: rotate(360deg); }
        }

        .appointment-calendar-wrapper .fc {
          font-family: var(--font-sans);
          --fc-border-color: var(--fc-border-color);
          --fc-button-bg-color: var(--fc-button-bg);
          --fc-button-border-color: var(--fc-button-border);
          --fc-button-hover-bg-color: var(--fc-button-hover-bg);
          --fc-button-hover-border-color: var(--fc-button-hover-border);
          --fc-button-active-bg-color: var(--fc-button-active-bg);
          --fc-today-bg-color: var(--fc-today-bg);
          --fc-page-bg-color: var(--fc-page-bg);
          --fc-neutral-bg-color: rgba(2, 6, 23, 0.35);
          --fc-list-event-hover-bg-color: var(--fc-list-hover);
        }

        .appointment-calendar-wrapper .fc-theme-standard td,
        .appointment-calendar-wrapper .fc-theme-standard th {
          border-color: var(--fc-border-color);
        }

        .appointment-calendar-wrapper .fc-scrollgrid {
          border-color: var(--fc-border-color);
        }

        .appointment-calendar-wrapper .fc-col-header-cell-cushion,
        .appointment-calendar-wrapper .fc-timegrid-slot-label-cushion,
        .appointment-calendar-wrapper .fc-list-day-cushion {
          color: rgb(148, 163, 184);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .appointment-calendar-wrapper .fc-toolbar-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: rgb(241, 245, 249);
          letter-spacing: -0.01em;
        }

        .appointment-calendar-wrapper .fc-button {
          text-transform: capitalize;
          font-weight: 500;
          border-radius: var(--radius-md);
          padding: 0.5rem 0.875rem;
          font-size: 0.8125rem;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }

        .appointment-calendar-wrapper .fc-button-primary:not(:disabled):hover {
          background: var(--fc-button-hover-bg-color) !important;
          border-color: var(--fc-button-hover-border-color) !important;
          color: rgb(94, 234, 212) !important;
        }

        .appointment-calendar-wrapper .fc-button-primary:not(:disabled).fc-button-active,
        .appointment-calendar-wrapper .fc-button-primary:not(:disabled):active {
          background: var(--fc-button-active-bg-color) !important;
          border-color: rgba(20, 184, 166, 0.5) !important;
          color: rgb(94, 234, 212) !important;
        }

        .appointment-calendar-wrapper .fc-timegrid-now-indicator-line {
          border-color: rgb(248, 113, 113);
          border-width: 2px;
        }

        .appointment-calendar-wrapper .fc-timegrid-event .fc-event-main {
          padding: 0;
        }

        .appointment-calendar-wrapper .fc-event {
          border-radius: 6px;
          overflow: hidden;
        }

        .fc-appointment-event {
          padding: 4px 8px;
          min-height: 100%;
        }

        .fc-appointment-event__title {
          font-size: 0.75rem;
          font-weight: 600;
          color: rgb(241, 245, 249);
          line-height: 1.25;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fc-appointment-event__meta {
          font-size: 0.6875rem;
          color: rgb(148, 163, 184);
          margin-top: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .appointment-calendar-wrapper .fc-daygrid-day-number {
          color: rgb(148, 163, 184);
          border-radius: var(--radius-sm);
          padding: 0.25rem 0.5rem;
          font-size: 0.8125rem;
          font-weight: 500;
        }

        .appointment-calendar-wrapper .fc-daygrid-day-number:hover {
          background: rgba(20, 184, 166, 0.12);
          color: rgb(94, 234, 212);
        }

        .appointment-calendar-wrapper .fc-list-event:hover td {
          background: var(--fc-list-event-hover-bg-color);
        }

        .appointment-calendar-wrapper .fc-more-link:hover {
          color: var(--color-accent);
        }

        @media (max-width: 768px) {
          .appointment-calendar-wrapper .fc-toolbar {
            flex-direction: column;
            gap: 0.5rem;
          }
          .appointment-calendar-wrapper .fc-toolbar-chunk {
            display: flex;
            justify-content: center;
          }
          .appointment-calendar-wrapper .fc-toolbar-title {
            font-size: 1rem;
          }
          .appointment-calendar-wrapper .fc-button {
            padding: 0.4rem 0.6rem;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
