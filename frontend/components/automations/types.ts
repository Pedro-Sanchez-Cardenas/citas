export interface AutomationRecord {
  id: number;
  name: string;
  trigger?: string;
  is_active?: boolean;
  conditions?: unknown;
  action?: unknown;
  [key: string]: unknown;
}

export interface AutomationFormPayload {
  name: string;
  trigger: string;
  conditions?: unknown;
  action?: unknown;
  is_active: boolean;
}
