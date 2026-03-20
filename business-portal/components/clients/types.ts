import type { Client } from '@/types';

export type { Client };
export type { CreateClientPayload } from '@/lib/api/clients';

export interface ClientHistoryAppointment {
  id: number;
  start_at?: string;
  service?: { name: string };
  combined_service?: { name: string };
  professional?: { name: string };
  status?: string;
}

export interface ClientMediaItem {
  id: number;
  url: string;
  type: string;
}

export interface ClientDetailData {
  client?: Client;
  appointments?: ClientHistoryAppointment[];
  media?: ClientMediaItem[];
}
