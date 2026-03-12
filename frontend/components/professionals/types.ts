import type { Professional, Branch } from '@/types';

export type { Professional, Branch };
export type { CreateProfessionalPayload } from '@/lib/api/professionals';

export interface ProfessionalFormPayload {
  name: string;
  branch_id: number;
  email?: string | null;
  phone?: string | null;
  color?: string | null;
  commission_rate?: number | null;
  base_salary_cents?: number | null;
  is_active?: boolean;
}
