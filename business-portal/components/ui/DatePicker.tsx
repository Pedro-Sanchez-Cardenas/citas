'use client';

import { useMemo, useCallback, useState } from 'react';
import Flatpickr from 'react-flatpickr';
import clsx from 'clsx';
import 'flatpickr/dist/themes/dark.css';
import { Spanish as localeEs } from 'flatpickr/dist/l10n/es';

function toDateOnly(date: string | Date): Date | null {
  if (date instanceof Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const d = new Date(String(date).slice(0, 10));
  d.setHours(0, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type DatePickerMode = 'single' | 'range';

export interface DatePickerProps {
  label?: string | null;
  hint?: string | null;
  error?: string | null;
  className?: string;
  inputClassName?: string;
  required?: boolean;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  mode?: DatePickerMode;
  enableTime?: boolean;
  value?: string | Date | [string | Date, string | Date] | null;
  onChange?: (value: Date | Date[] | null, dateStr: string) => void;
  minDate?: string | Date;
  maxDate?: string | Date;
  enabledDates?: (string | Date)[];
  disabledDates?: (string | Date)[];
  dateFormat?: string;
  altFormat?: string;
  useAltInput?: boolean;
}

const inputBase =
  'w-full min-h-(--touch-min) rounded-xl border border-slate-700/80 bg-surface-elevated/60 pl-10 pr-4 py-2.5 text-sm text-slate-50 outline-none ring-0 transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-60 placeholder:text-slate-500';

const inputError =
  'border-red-500/80 bg-red-950/30 focus:border-red-500 focus:ring-red-500/30';

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
  enabledDates,
  disabledDates,
  dateFormat: dateFormatProp,
  altFormat: altFormatProp,
  useAltInput = true,
  ...rest
}: DatePickerProps) {
  const [nativeError, setNativeError] = useState<string | null>(null);
  const effectiveError = error ?? nativeError;
  const isRange = mode === 'range';
  const dateFormat = dateFormatProp ?? (enableTime ? 'Y-m-d H:i' : 'Y-m-d');
  const altFormat = altFormatProp ?? (enableTime ? 'd/m/Y H:i' : 'd/m/Y');
  const defaultPlaceholder = enableTime
    ? 'Seleccionar fecha y hora'
    : isRange
      ? 'Seleccionar rango de fechas'
      : 'Seleccionar fecha';
  const resolvedPlaceholder = placeholder ?? defaultPlaceholder;

  const handleChange = useCallback(
    (selectedDates: Date[], dateStr: string) => {
      if (nativeError && selectedDates.length > 0) {
        setNativeError(null);
      }
      if (!onChange) return;
      if (isRange) {
        const next =
          selectedDates.length === 2
            ? [selectedDates[0], selectedDates[1]]
            : selectedDates.length === 1
              ? [selectedDates[0], selectedDates[0]]
              : [];
        onChange(next, dateStr);
      } else {
        onChange(selectedDates[0] ?? null, dateStr);
      }
    },
    [onChange, isRange, nativeError]
  );

  const options = useMemo(() => {
    let defaultDate: string | Date | (string | Date)[] | undefined;
    if (value != null && value !== '') {
      defaultDate = Array.isArray(value) ? value : (value as string | Date);
    }
    const opts: Record<string, unknown> = {
      mode: isRange ? 'range' : 'single',
      dateFormat,
      altInput: useAltInput,
      altFormat,
      defaultDate,
      minDate: minDate ?? undefined,
      maxDate: maxDate ?? undefined,
      locale: localeEs,
      allowInput: false,
      disableMobile: true,
      enableTime: enableTime || undefined,
      time_24hr: true,
    };
    if (enabledDates != null && Array.isArray(enabledDates) && enabledDates.length > 0) {
      opts.enable = enabledDates.map(toDateOnly).filter(Boolean);
    }
    if (disabledDates != null && Array.isArray(disabledDates) && disabledDates.length > 0) {
      opts.disable = disabledDates.map(toDateOnly).filter(Boolean);
    }
    return opts;
  }, [isRange, dateFormat, altFormat, minDate, maxDate, enableTime, enabledDates, disabledDates, useAltInput, value]);

  return (
    <div className={clsx('space-y-1.5', className)}>
      {label && (
        <label
          className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-slate-400"
          htmlFor={id}
        >
          {label}
          {required && <span className="ml-0.5 text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        <Flatpickr
          id={id}
          onChange={handleChange}
          options={options}
          placeholder={resolvedPlaceholder}
          disabled={disabled}
          className={clsx(
            'flatpickr-input',
            inputBase,
            inputClassName,
            effectiveError && inputError
          )}
          aria-invalid={!!effectiveError}
          aria-describedby={hint && id ? `${id}-hint` : undefined}
          onInvalid={(e) => {
            if (error) return;
            setNativeError(
              (e.target as HTMLInputElement).validationMessage || 'Campo inválido.'
            );
          }}
          {...rest}
        />
        <span className="pointer-events-none absolute inset-y-0 left-3 flex min-h-(--touch-min) items-center text-slate-500">
          <svg
            aria-hidden="true"
            className="h-4 w-4 shrink-0"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="3"
              y="4"
              width="14"
              height="13"
              rx="2"
              className="stroke-current"
              strokeWidth="1.3"
            />
            <path
              d="M7 2.5V5.5"
              className="stroke-current"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d="M13 2.5V5.5"
              className="stroke-current"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d="M3 8H17"
              className="stroke-current"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </div>
      {hint && !effectiveError && (
        <p
          id={id ? `${id}-hint` : undefined}
          className="text-[11px] text-slate-500"
        >
          {hint}
        </p>
      )}
      {effectiveError && (
        <p className="text-[11px] text-red-300">
          {effectiveError}
        </p>
      )}
    </div>
  );
}
