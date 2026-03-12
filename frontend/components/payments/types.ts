import type { Appointment } from '@/types';

export interface AppointmentWithBranch extends Appointment {
  branch_id?: number;
}

export interface PaymentItem {
  id: number;
  client_name?: string;
  method?: string;
  amount?: number;
  currency?: string;
  paid_at?: string;
  created_at?: string;
  reference?: string;
  [key: string]: unknown;
}

export interface PaymentFormPayload {
  branch_id: number;
  appointment_id?: number | null;
  client_id?: number | null;
  method: string;
  amount_cents: number;
  tip_cents?: number | null;
  currency: string;
  status: string;
  provider_payment_id?: string | null;
}
