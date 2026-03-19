export interface AppointmentRow {
  id: number;
  start_at?: string;
  status?: string;
  service?: { name?: string };
  combined_service?: { name?: string };
  professional?: { name?: string };
}

export interface AppointmentsListProps {
  items: AppointmentRow[];
  emptyText?: string;
}

export default function AppointmentsList({
  items,
  emptyText = 'Aún no tienes citas registradas.',
}: AppointmentsListProps) {
  if (items.length === 0) {
    return <p className="mt-3 text-sm text-slate-400">{emptyText}</p>;
  }

  return (
    <div className="mt-4 space-y-2">
      {items.map((a) => (
        <div
          key={a.id}
          className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm"
        >
          <p className="text-slate-200">
            {a.start_at ? new Date(a.start_at).toLocaleString() : 'Sin fecha'}
          </p>
          <p className="text-slate-400">
            {a.service?.name ?? a.combined_service?.name ?? 'Servicio'} ·{' '}
            {a.professional?.name ?? 'Profesional'}
          </p>
          <p className="text-xs text-slate-500">{a.status ?? 'scheduled'}</p>
        </div>
      ))}
    </div>
  );
}

