export interface BusinessSummary {
  total_revenue_formatted?: string;
  appointments_attended?: number | string;
  new_clients?: number | string;
  [key: string]: unknown;
}

export interface ReportRow {
  id: number;
  name: string;
  appointments_count?: number | string;
  revenue_formatted?: string;
  average_ticket_formatted?: string;
  [key: string]: unknown;
}
