/**
 * Tipos compartidos del frontend.
 * Organización: modelos de dominio, respuestas API y props de componentes.
 */

// --- API genérica ---
export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
}

// --- Auth / Usuario ---
export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
  roles?: string[];
  permissions?: string[];
  [key: string]: unknown;
}

// --- Entidades comunes (campos que suelen venir del backend) ---
export interface BaseEntity {
  id: number;
  created_at?: string;
  updated_at?: string;
}

export interface Appointment {
  id: number;
  branch_id?: number;
  professional_id?: number;
  service_id?: number | null;
  client_id?: number | null;
  client?: { id: number; name: string; phone?: string | null; email?: string | null } | null;
  start_at: string;
  end_at: string;
  status?: string;
  notes?: string | null;
  professional?: { id: number; name: string } | null;
  service?: { id: number; name: string } | null;
  [key: string]: unknown;
}

export interface Client {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  birthday?: string | null;
  gender?: string | null;
  notes?: string | null;
  allergies?: string | null;
  photo_path?: string | null;
  photo_url?: string | null;
  [key: string]: unknown;
}

export interface Professional {
  id: number;
  name: string;
  branch_id?: number | null;
  [key: string]: unknown;
}

export interface Service {
  id: number;
  name: string;
  branch_id?: number | null;
  [key: string]: unknown;
}

export interface Branch {
  id: number;
  name: string;
  [key: string]: unknown;
}

// --- Utilidad para páginas Next ---
export type NextPageProps<T = Record<string, unknown>> = {
  [K in keyof T]: T[K];
};
