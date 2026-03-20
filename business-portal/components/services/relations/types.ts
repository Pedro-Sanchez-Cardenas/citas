import type { Service } from '@/types';

export interface ProductItem {
  id: number;
  name: string;
  sku?: string;
  unit?: string;
  [key: string]: unknown;
}

export interface ServiceWithCode extends Service {
  code?: string;
  duration_minutes?: number;
}

export interface MaterialEntry {
  checked: boolean;
  quantity: number | string;
}
