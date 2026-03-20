'use client';

import type { ChangeEvent } from 'react';
import { Input } from '@/components/ui';
import clsx from 'clsx';

export interface SearchBarProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  count?: number;
  countLabel?: string;
  id?: string;
  className?: string;
  inputClassName?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar...',
  count,
  countLabel,
  id = 'search',
  className = '',
  inputClassName = '',
}: SearchBarProps) {
  return (
    <section
      className={clsx(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="relative flex-1">
        <span
          className="pointer-events-none absolute inset-y-0 left-3 flex min-h-(--touch-min) items-center text-slate-500"
          aria-hidden
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </span>
        <Input
          id={id}
          type="search"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          inputClassName={clsx('pl-10', inputClassName)}
          className="mb-0"
        />
      </div>
      {count !== undefined && (
        <div className="text-[11px] text-slate-500 sm:shrink-0">
          {countLabel ?? 'visibles'}: {count}
        </div>
      )}
    </section>
  );
}
