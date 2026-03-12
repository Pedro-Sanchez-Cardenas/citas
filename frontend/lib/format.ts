const LOCALE = 'es';

/**
 * Formatea una fecha ISO del backend a solo fecha legible (ej. "4 dic 1998").
 */
export function formatDate(value: string | null | undefined): string {
  if (value == null || value === '') return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(LOCALE, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

/**
 * Formatea una fecha/hora ISO a fecha y hora legible (ej. "4 dic 1998, 10:30").
 */
export function formatDateTime(value: string | null | undefined): string {
  if (value == null || value === '') return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(LOCALE, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

/**
 * Formatea una fecha ISO a solo hora (ej. "10:30").
 */
export function formatHour(value: string | null | undefined): string {
  if (value == null || value === '') return '';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value).slice(11, 16) || '';
    return d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return String(value).slice(11, 16) || '';
  }
}
