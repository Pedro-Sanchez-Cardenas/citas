const LOCALE = 'es';

function extractDatePart(value: string): string | null {
  // Soporta:
  // - "YYYY-MM-DD"
  // - "YYYY-MM-DDTHH:MM:SSZ" (Laravel / ISO datetime)
  // - "YYYY-MM-DD HH:MM:SS"
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return m?.[1] ?? null;
}

function formatYMDAsLocalDate(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return ymd;
  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(year, monthIndex, day);
  return d.toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formatea una fecha ISO del backend a solo fecha legible (ej. "4 dic 1998").
 */
export function formatDate(value: string | null | undefined): string {
  if (value == null || value === '') return '—';
  try {
    const ymd = extractDatePart(String(value));
    if (ymd) return formatYMDAsLocalDate(ymd);
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' });
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
    // Si solo viene como fecha, usamos formatDate para no depender del timezone.
    if (!String(value).includes('T') && !String(value).includes(':')) {
      return formatDate(value);
    }
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
    const s = String(value);
    // Acepta:
    // - "HH:MM"
    // - "HH:MM:SS"
    // - ISO datetime "...THH:MM:SSZ"
    const timeOnly = /^(\d{2}:\d{2})(?::\d{2})?$/.exec(s);
    if (timeOnly) return timeOnly[1];
    const isoTime = /^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})(?::\d{2})/.exec(s);
    if (isoTime) return isoTime[1];

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return String(value);
  }
}
