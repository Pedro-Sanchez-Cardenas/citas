import type { Service } from '@/types';
import type { CreateServicePayload } from '@/lib/api/services';

export type { Service };
export type { CreateServicePayload } from '@/lib/api/services';

export interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
}

export interface ServiceWithCategory extends Service {
  code?: string;
  duration_minutes?: number;
  price_cents?: number | null;
  currency?: string;
  service_category_id?: number | null;
  is_active?: boolean;
  service_category?: { id: number; name: string };
}

export interface ServiceFormPayload extends CreateServicePayload {
  code?: string;
  duration_minutes?: number;
  price_cents?: number | null;
  currency?: string;
  service_category_id?: number | null;
  is_active?: boolean;
}
