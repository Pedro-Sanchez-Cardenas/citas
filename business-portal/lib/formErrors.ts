import type { AxiosError } from 'axios';

export type FormFieldErrors = Record<string, string>;

interface ApiValidationPayload {
  message?: string;
  errors?: Record<string, string[] | string>;
}

export function extractFieldErrors(error: unknown): FormFieldErrors {
  const ax = error as AxiosError<ApiValidationPayload>;
  const errors = ax?.response?.data?.errors;
  if (!errors || typeof errors !== 'object') return {};

  const out: FormFieldErrors = {};
  Object.entries(errors).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (value[0]) out[key] = String(value[0]);
      return;
    }
    if (value != null) out[key] = String(value);
  });
  return out;
}
