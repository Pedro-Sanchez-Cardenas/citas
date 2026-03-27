export interface CombinedItemRow {
  service_id: string | number;
  position: number;
  offset_minutes: number;
  duration_minutes: number | string;
}

export interface CombinedServiceItem {
  service_id?: number;
  position?: number;
  offset_minutes?: number;
  duration_minutes?: number | null;
  service?: { name: string };
}

export interface CombinedServiceRecord {
  id: number;
  name: string;
  code?: string;
  total_duration_minutes?: number | null;
  is_active?: boolean;
  items?: CombinedServiceItem[];
  [key: string]: unknown;
}

export interface CombinedFormPayload {
  name: string;
  code: string;
  total_duration_minutes?: number | null;
  is_active: boolean;
  items: {
    /** Puede ser null en filas aún sin servicio seleccionado; el backend valida. */
    service_id: number | null;
    position: number;
    offset_minutes: number;
    duration_minutes: number | null;
  }[];
}
