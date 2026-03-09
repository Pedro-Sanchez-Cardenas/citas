'use client';

import { useCallback, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { DatesSetArg, EventClickArg, EventContentArg } from '@fullcalendar/core';

export interface AgendaCalendarEvent {
  id: number;
  start_at: string;
  end_at: string;
  client_name?: string | null;
  professional_name?: string | null;
  service_name?: string | null;
  status?: string | null;
  [key: string]: unknown;
}

interface AgendaCalendarProps {
  events: AgendaCalendarEvent[];
  showCancelled?: boolean;
  onDatesSet?: (start: Date, end: Date) => void;
  onEventClick?: (event: AgendaCalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  initialView?: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth' | 'listWeek';
  height?: string | number;
  loading?: boolean;
}

function eventStatusColor(status: string | null | undefined): { bg: string; border: string } {
  if (status === 'cancelled' || status === 'no_show') {
    return { bg: 'rgba(239, 68, 68, 0.25)', border: 'rgba(239, 68, 68, 0.5)' };
  }
  if (status === 'attended') {
    return { bg: 'rgba(16, 185, 129, 0.25)', border: 'rgba(16, 185, 129, 0.5)' };
  }
  if (status === 'confirmed') {
    return { bg: 'rgba(14, 165, 233, 0.25)', border: 'rgba(14, 165, 233, 0.5)' };
  }
  return { bg: 'rgba(45, 212, 191, 0.2)', border: 'rgba(45, 212, 191, 0.45)' };
}

function renderEventContent(arg: EventContentArg) {
  const ext = arg.event.extendedProps as {
    client_name?: string;
    service_name?: string;
    professional_name?: string;
    status?: string;
  };
  const { bg, border } = eventStatusColor(ext?.status);
  return (
    <div
      className="fc-event-main-frame"
      style={{
        background: bg,
        borderLeft: `3px solid ${border}`,
        padding: '2px 6px',
        borderRadius: '6px',
        overflow: 'hidden',
      }}
    >
      <div className="font-medium text-slate-100 truncate" style={{ fontSize: '0.75rem' }}>
        {ext?.client_name || arg.event.title || 'Cita'}
      </div>
      {(ext?.service_name || ext?.professional_name) && (
        <div className="text-slate-400 truncate" style={{ fontSize: '0.65rem' }}>
          {[ext.service_name, ext.professional_name].filter(Boolean).join(' · ')}
        </div>
      )}
    </div>
  );
}

export default function AgendaCalendar({
  events,
  showCancelled = false,
  onDatesSet,
  onEventClick,
  onDateClick,
  initialView = 'timeGridWeek',
  height = 'auto',
  loading = false,
}: AgendaCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);

  const filteredEvents = showCancelled
    ? events
    : events.filter(
        (e) => e.status !== 'cancelled' && e.status !== 'no_show'
      );

  const fcEvents = filteredEvents.map((e) => {
    const { bg, border } = eventStatusColor(e.status ?? null);
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

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      onDatesSet?.(arg.start, arg.end);
    },
    [onDatesSet]
  );

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      const ext = arg.event.extendedProps as AgendaCalendarEvent;
      if (ext?.id != null) {
        onEventClick?.({
          ...ext,
          id: typeof ext.id === 'number' ? ext.id : Number(ext.id),
          start_at: arg.event.startStr,
          end_at: arg.event.endStr,
        });
      }
    },
    [onEventClick]
  );

  return (
    <div className="relative rounded-2xl border border-slate-800/80 bg-slate-900/40 shadow-xl overflow-hidden">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/70 rounded-2xl">
          <div className="text-sm text-slate-400 flex items-center gap-2">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
            Cargando agenda...
          </div>
        </div>
      )}
      <div className="agenda-calendar-wrapper p-2 sm:p-3">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={initialView}
          events={fcEvents}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          dateClick={onDateClick ? (arg) => onDateClick(arg.date) : undefined}
          eventContent={renderEventContent}
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
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          slotDuration="00:30:00"
          allDaySlot={false}
          nowIndicator
          navLinks
          editable={false}
          selectable={!!onDateClick}
          dayMaxEvents={3}
          moreLinkClick="popover"
        />
      </div>
      <style jsx global>{`
        .agenda-calendar-wrapper {
          --fc-border-color: rgba(51, 65, 85, 0.6);
          --fc-button-bg-color: rgba(15, 23, 42, 0.9);
          --fc-button-border-color: rgba(71, 85, 105, 0.6);
          --fc-button-hover-bg-color: rgba(30, 41, 59, 0.95);
          --fc-button-hover-border-color: rgba(94, 234, 212, 0.4);
          --fc-button-active-bg-color: rgba(45, 212, 191, 0.2);
          --fc-today-bg-color: rgba(45, 212, 191, 0.06);
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: rgba(15, 23, 42, 0.4);
          --fc-list-event-hover-bg-color: rgba(45, 212, 191, 0.1);
        }
        .agenda-calendar-wrapper .fc {
          font-family: inherit;
        }
        .agenda-calendar-wrapper .fc-theme-standard td,
        .agenda-calendar-wrapper .fc-theme-standard th {
          border-color: var(--fc-border-color);
        }
        .agenda-calendar-wrapper .fc-scrollgrid {
          border-color: var(--fc-border-color);
        }
        .agenda-calendar-wrapper .fc-col-header-cell-cushion,
        .agenda-calendar-wrapper .fc-timegrid-slot-label-cushion,
        .agenda-calendar-wrapper .fc-list-day-cushion {
          color: rgb(148, 163, 184);
        }
        .agenda-calendar-wrapper .fc-toolbar-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: rgb(241, 245, 249);
        }
        .agenda-calendar-wrapper .fc-button {
          text-transform: capitalize;
          font-weight: 500;
          border-radius: 0.75rem;
          padding: 0.4rem 0.75rem;
        }
        .agenda-calendar-wrapper .fc-button-primary:not(:disabled):hover {
          background: var(--fc-button-hover-bg-color);
          border-color: var(--fc-button-hover-border-color);
          color: rgb(94, 234, 212);
        }
        .agenda-calendar-wrapper .fc-button-primary:not(:disabled).fc-button-active,
        .agenda-calendar-wrapper .fc-button-primary:not(:disabled):active {
          background: var(--fc-button-active-bg-color);
          border-color: rgba(45, 212, 191, 0.5);
          color: rgb(94, 234, 212);
        }
        .agenda-calendar-wrapper .fc-timegrid-now-indicator-line {
          border-color: rgb(248, 113, 113);
        }
        .agenda-calendar-wrapper .fc-timegrid-event .fc-event-main {
          padding: 0;
        }
        .agenda-calendar-wrapper .fc-daygrid-day-number {
          color: rgb(148, 163, 184);
          border-radius: 0.5rem;
          padding: 0.25rem 0.5rem;
        }
        .agenda-calendar-wrapper .fc-daygrid-day-number:hover {
          background: rgba(45, 212, 191, 0.15);
          color: rgb(94, 234, 212);
        }
        .agenda-calendar-wrapper .fc-list-event:hover td {
          background: var(--fc-list-event-hover-bg-color);
        }
      `}</style>
    </div>
  );
}
