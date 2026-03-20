export interface ServiceCategoryRecord {
  id: number;
  name: string;
  description?: string | null;
  [key: string]: unknown;
}

export interface CategoryFormPayload {
  name: string;
  description?: string | null;
}
