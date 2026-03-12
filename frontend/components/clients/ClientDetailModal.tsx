import { useEffect, useState } from 'react';
import { fetchClientHistory } from '@/lib/api/clients';
import { clientPhotoUrl } from '@/lib/api';
import { Modal } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import type { Client } from '@/types';
import type { ClientDetailData } from './types';

export interface ClientDetailModalProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
}

export function ClientDetailModal({ open, onClose, client }: ClientDetailModalProps) {
  const [data, setData] = useState<ClientDetailData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !client?.id) return;
    let cancelled = false;
    setLoading(true);
    setData(null);
    fetchClientHistory(client.id)
      .then((res) => {
        if (!cancelled) setData((res as ClientDetailData) ?? { client, appointments: [], media: [] });
      })
      .catch(() => {
        if (!cancelled) setData({ client, appointments: [], media: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, client?.id, client]);

  const clientData = data?.client ?? client;
  const appointments = data?.appointments ?? [];

  return (
    <Modal open={open} onClose={onClose} title="Detalle del cliente" description="" size="lg">
      {loading ? (
        <div className="py-8 text-center text-sm text-slate-400">Cargando...</div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-4 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-slate-700/80 bg-slate-800">
              {clientData?.photo_url ? (
                <img
                  src={clientPhotoUrl(clientData.photo_url) ?? ''}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-lg font-medium text-slate-400">
                  {clientData?.name?.[0]?.toUpperCase() ?? '?'}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-50">{clientData?.name}</p>
              {(clientData?.email || clientData?.phone) && (
                <p className="mt-1 text-xs text-slate-400">
                  {[clientData?.email, clientData?.phone].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            <p className="mb-2 text-xs font-medium text-slate-400">Historial de citas</p>
            {appointments.length === 0 ? (
              <p className="text-xs text-slate-500">Sin citas registradas.</p>
            ) : (
              appointments.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/80 px-3 py-2 text-xs"
                >
                  <span className="text-slate-200">{formatDateTime(a.start_at)}</span>
                  <span className="text-slate-400">{a.service?.name ?? a.combined_service?.name ?? '—'}</span>
                  <span className="text-slate-400">{a.professional?.name ?? '—'}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${a.status === 'attended' ? 'bg-emerald-500/20 text-emerald-300' : a.status === 'cancelled' ? 'bg-red-500/20 text-red-300' : 'bg-slate-700 text-slate-300'}`}>
                    {a.status ?? '—'}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
