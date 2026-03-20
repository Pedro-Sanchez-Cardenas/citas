export interface SetupStep {
  key: string;
  label: string;
  completed?: boolean;
  count?: number;
  [key: string]: unknown;
}

export interface BusinessSetup {
  completed?: boolean;
  steps?: SetupStep[];
  [key: string]: unknown;
}
