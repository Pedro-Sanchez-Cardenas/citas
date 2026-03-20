export interface StockRow {
  product_id: number;
  branch_id: number;
  product_name?: string;
  branch_name?: string;
  quantity?: number;
  min_quantity?: number;
  unit?: string;
  [key: string]: unknown;
}

export interface AdjustPayload {
  product_id: number;
  branch_id: number;
  type: string;
  quantity: number;
  reason: string;
}
