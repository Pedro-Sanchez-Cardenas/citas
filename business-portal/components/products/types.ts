export interface ProductItem {
  id: number;
  name: string;
  sku?: string;
  category?: string;
  unit?: string;
  cost_cents?: number;
  price_cents?: number | null;
  is_reusable?: boolean;
  [key: string]: unknown;
}

export interface ProductFormPayload {
  name: string;
  sku: string;
  category?: string | null;
  unit: string;
  cost_cents: number;
  price_cents?: number | null;
  is_reusable: boolean;
}
