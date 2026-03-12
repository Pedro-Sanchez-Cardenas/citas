export interface AgendaItem {
  id: number;
  professional_name?: string;
  start_at: string;
  end_at: string;
  client_name?: string;
  service_name?: string;
  status?: string;
  day_label?: string;
  date?: string;
  [key: string]: unknown;
}
