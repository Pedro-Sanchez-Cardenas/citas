'use client';

import { useMemo, useCallback } from 'react';
import Flatpickr from 'react-flatpickr';
import clsx from 'clsx';
import 'flatpickr/dist/flatpickr.min.css';

// Locale español (opcional: si falla el import, el calendario usa inglés)
import { Spanish as localeEs } from 'flatpickr/dist/l10n/es.js';

/** Formatea Date a "YYYY-MM-DDTHH:mm" para datetime-local */
function toDateTimeLocalString(date) {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Parsea string "YYYY-MM-DDTHH:mm" o "YYYY-MM-DD" a Date */
function parseValue(value) {
  if (value == null || value === '') return undefined;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * DatePicker basado en Flatpickr.
 *
 * @param {string} [mode='single'] - 'single' | 'range'
 * @param {boolean} [enableTime=false] - Si true, permite elegir hora (datetime).
 * @param {string|Date|Array<string|Date>|null} value - Fecha(s). Con enableTime: string "YYYY-MM-DDTHH:mm"
 * @param {Function} onChange - (value, dateStr) => {}. En single: value es Date|null; dateStr "Y-m-d" o "YYYY-MM-DDTHH:mm". En range: value es [Date, Date]|[]
 * @param {string|Date} [minDate] - Fecha mínima seleccionable
 * @param {string|Date} [maxDate] - Fecha máxima seleccionable
 * @param {string} [dateFormat] - Por defecto 'Y-m-d' o 'Y-m-d H:i' si enableTime
 */
export default function DatePicker({
  label,
  hint,
  error,
  className,
  inputClassName,
  required,
  id,
  placeholder,
  disabled,
  mode = 'single',
  enableTime = false,
  value,
  onChange,
  minDate,
  maxDate,
  dateFormat: dateFormatProp,
  ...rest
}) {
  const isRange = mode === 'range';
  const dateFormat = dateFormatProp ?? (enableTime ? 'Y-m-d H:i' : 'Y-m-d');
  const defaultPlaceholder = enableTime
    ? 'Seleccionar fecha y hora'
    : isRange
      ? 'Seleccionar rango de fechas'
      : 'Seleccionar fecha';
  const resolvedPlaceholder = placeholder ?? defaultPlaceholder;

  const normalizedValue = useMemo(() => {
    if (value == null || value === '') return undefined;
    if (isRange && Array.isArray(value)) {
      const parsed = value.map(parseValue).filter(Boolean);
      if (parsed.length === 2) return parsed;
      if (parsed.length === 1) return [parsed[0], parsed[0]];
      return undefined;
    }
    return parseValue(value);
  }, [value, isRange]);

  const handleChange = useCallback(
    (selectedDates, dateStr) => {
      if (!onChange) return;
      if (enableTime && selectedDates[0]) {
        const dateStrOut = toDateTimeLocalString(selectedDates[0]);
        if (isRange && selectedDates.length === 2) {
          onChange([selectedDates[0], selectedDates[1]], `${dateStrOut} - ${toDateTimeLocalString(selectedDates[1])}`);
        } else if (!isRange) {
          onChange(selectedDates[0], dateStrOut);
        } else {
          const next = selectedDates.length === 1 ? [selectedDates[0], selectedDates[0]] : [];
          onChange(next, next.length === 2 ? `${toDateTimeLocalString(next[0])} - ${toDateTimeLocalString(next[1])}` : '');
        }
        return;
      }
      if (isRange) {
        const next = selectedDates.length === 2 ? [selectedDates[0], selectedDates[1]] : selectedDates.length === 1 ? [selectedDates[0], selectedDates[0]] : [];
        onChange(next, dateStr);
      } else {
        onChange(selectedDates[0] ?? null, dateStr);
      }
    },
    [onChange, isRange, enableTime]
  );

  const options = useMemo(
    () => ({
      mode: isRange ? 'range' : 'single',
      dateFormat,
      minDate: minDate ?? undefined,
      maxDate: maxDate ?? undefined,
      locale: localeEs,
      allowInput: false,
      disableMobile: true,
      enableTime: enableTime || undefined,
      time_24hr: true,
    }),
    [isRange, dateFormat, minDate, maxDate, enableTime]
  );

  return (
    <div className={className}>
      {label && (
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.16em] text-slate-400" htmlFor={id}>
          {label}
          {required && <span className="ml-0.5 text-red-400">*</span>}
        </label>
      )}
      <Flatpickr
        id={id}
        value={normalizedValue}
        onChange={handleChange}
        options={options}
        placeholder={resolvedPlaceholder}
        disabled={disabled}
        className={clsx(
          'flatpickr-input w-full rounded-xl border border-slate-700/70 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-50 outline-none ring-0 transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50',
          error && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/40',
          inputClassName
        )}
        aria-invalid={!!error}
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...rest}
      />
      {hint && !error && (
        <p id={id ? `${id}-hint` : undefined} className="mt-1 text-[11px] text-slate-500">
          {hint}
        </p>
      )}
      {error && <p className="mt-1 text-[11px] text-red-300">{error}</p>}
    </div>
  );
}
