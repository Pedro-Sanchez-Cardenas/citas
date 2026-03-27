import clsx from 'clsx';
import {
  Children,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactElement,
  type ReactNode,
  isValidElement,
} from 'react';
import type { SelectHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string | null;
  hint?: string | null;
  error?: string | null;
  className?: string;
  selectClassName?: string;
  required?: boolean;
  children?: ReactNode;
}

export default function Select({
  label,
  hint,
  error,
  className,
  selectClassName,
  required,
  children,
  id,
  onChange,
  onInvalid,
  ...props
}: SelectProps) {
  const [nativeError, setNativeError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(() => String(props.defaultValue ?? ''));
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const fieldId = id ?? `select-${generatedId}`;
  const listboxId = `${fieldId}-listbox`;
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number; maxHeight: number }>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 256,
  });
  const effectiveError = error ?? nativeError;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = effectiveError ? `${fieldId}-error` : undefined;
  const controlledValue = props.value;
  const currentValue = controlledValue != null ? String(controlledValue) : internalValue;

  type SelectOptionItem =
    | { type: 'option'; value: string; label: string; disabled: boolean }
    | { type: 'group'; label: string };

  const options = useMemo<SelectOptionItem[]>(() => {
    const items: SelectOptionItem[] = [];
    const readNode = (node: unknown) => {
      if (!isValidElement(node) || typeof node.type !== 'string' || node.type !== 'option') return;
      const optionNode = node as ReactElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>;
      const value = String(optionNode.props.value ?? '');
      const optionLabel =
        typeof optionNode.props.children === 'string'
          ? optionNode.props.children
          : String(optionNode.props.children ?? value);
      items.push({
        type: 'option',
        value,
        label: optionLabel,
        disabled: !!optionNode.props.disabled,
      });
    };

    const visit = (node: unknown) => {
      if (!isValidElement(node)) return;
      const element = node as ReactElement<{ label?: string; children?: ReactNode }>;

      if (typeof element.type === 'string' && element.type === 'option') {
        readNode(element);
        return;
      }

      if (typeof element.type === 'string' && element.type === 'optgroup') {
        const groupNode = element as ReactElement<{ label?: string; children?: ReactNode }>;
        const groupLabel = String(groupNode.props.label ?? '');
        if (groupLabel) items.push({ type: 'group', label: groupLabel });
        Children.toArray(groupNode.props.children).forEach(visit);
        return;
      }

      // Fragment u otros wrappers: recorrer hijos para no perder opciones.
      Children.toArray(element.props.children).forEach(visit);
    };

    Children.toArray(children).forEach(visit);

    return items;
  }, [children]);

  const selectedLabel = useMemo(() => {
    const selected = options.find(
      (item) => item.type === 'option' && item.value === currentValue
    ) as SelectOptionItem | undefined;
    if (selected && selected.type === 'option') return selected.label;
    const firstOption = options.find((item) => item.type === 'option') as
      | SelectOptionItem
      | undefined;
    return firstOption && firstOption.type === 'option'
      ? firstOption.label
      : 'Seleccionar...';
  }, [options, currentValue]);

  useEffect(() => {
    if (!open) return;

    const updateMenuPosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const safeMargin = 8;
      const gap = 8;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const spaceBelow = viewportHeight - rect.bottom - gap - safeMargin;
      const spaceAbove = rect.top - gap - safeMargin;
      const contentHeight = Math.min(listboxRef.current?.scrollHeight ?? 256, 256);
      const openUp = spaceBelow < contentHeight && spaceAbove > spaceBelow;
      const availableSpace = openUp ? spaceAbove : spaceBelow;
      const maxHeight = Math.max(120, Math.min(256, availableSpace));
      const renderedHeight = Math.min(contentHeight, maxHeight);
      const width = Math.min(rect.width, viewportWidth - safeMargin * 2);
      const unclampedLeft = rect.left;
      const left = Math.max(safeMargin, Math.min(unclampedLeft, viewportWidth - safeMargin - width));
      const top = openUp
        ? Math.max(safeMargin, rect.top - gap - renderedHeight)
        : Math.min(viewportHeight - safeMargin - renderedHeight, rect.bottom + gap);

      setMenuPosition({
        top,
        left,
        width,
        maxHeight,
      });
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target) && !listboxRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const handleScroll = () => {
      setOpen(false);
    };

    updateMenuPosition();
    const rafId = window.requestAnimationFrame(updateMenuPosition);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  const emitChange = (value: string) => {
    if (controlledValue == null) setInternalValue(value);
    if (nativeError) setNativeError(null);
    onChange?.({ target: { value } } as ChangeEvent<HTMLSelectElement>);
  };

  return (
    <div className={clsx('space-y-1.5', className)}>
      {label && (
        <label
          className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-slate-400"
          htmlFor={fieldId}
        >
          {label}
          {required && <span className="ml-0.5 text-red-400">*</span>}
        </label>
      )}
      <div ref={wrapperRef} className="group relative">
        <select
          id={fieldId}
          name={props.name}
          value={currentValue}
          required={required}
          disabled={props.disabled}
          onInvalid={(e) => {
            if (error) return;
            setNativeError(e.currentTarget.validationMessage || 'Campo inválido.');
            onInvalid?.(e);
          }}
          onChange={() => {
            // La selección visual controla el valor.
          }}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        >
          {children}
        </select>

        <button
          type="button"
          className={clsx(
            'w-full min-h-(--touch-min) rounded-xl border border-white/10 bg-slate-950/45 px-4 pr-14 py-2.5 text-left text-sm text-slate-50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] outline-none ring-0 backdrop-blur-sm transition',
            'focus:outline-none focus:ring-2 focus:ring-teal-400/25 focus:border-teal-400/70',
            'disabled:cursor-not-allowed disabled:opacity-60',
            'relative',
            selectClassName,
            effectiveError &&
              'border-red-500/80 bg-red-950/30 focus:border-red-500 focus:ring-red-500/30'
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          disabled={props.disabled}
          onClick={() => setOpen((prev) => !prev)}
          ref={triggerRef}
        >
          <span className="block truncate">{selectedLabel}</span>
          <span
            className={clsx(
              'pointer-events-none absolute inset-y-1.5 right-1.5 flex w-10 items-center justify-center rounded-lg border border-white/8 bg-slate-900/65 text-slate-400 transition',
              open && 'text-teal-200'
            )}
            aria-hidden
          >
            <svg className={clsx('h-4 w-4 transition-transform', open && 'rotate-180')} viewBox="0 0 20 20" fill="none">
              <path
                d="M6 8l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>

        {open &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              id={listboxId}
              ref={listboxRef}
              role="listbox"
              className="fixed z-120 overflow-y-auto rounded-xl border border-white/10 bg-slate-900/90 p-1 shadow-(--shadow-modal) backdrop-blur-xl"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                width: `${menuPosition.width}px`,
                maxHeight: `${menuPosition.maxHeight}px`,
              }}
            >
              {options.map((item, idx) =>
                item.type === 'group' ? (
                  <div
                    key={`group-${idx}`}
                    className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                  >
                    {item.label}
                  </div>
                ) : (
                  <button
                    key={`${item.value}-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={item.value === currentValue}
                    disabled={item.disabled}
                    onClick={() => {
                      if (item.disabled) return;
                      emitChange(item.value);
                      setOpen(false);
                    }}
                    className={clsx(
                      'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition',
                      item.disabled
                        ? 'cursor-not-allowed text-slate-600'
                        : item.value === currentValue
                          ? 'bg-teal-500/15 text-teal-100 ring-1 ring-teal-500/30'
                          : 'text-slate-200 hover:bg-white/8'
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.value === currentValue && (
                      <span className="ml-2 text-xs text-teal-300" aria-hidden>✓</span>
                    )}
                  </button>
                )
              )}
            </div>,
            document.body
          )}
      </div>
      {hint && !effectiveError && (
        <p id={hintId} className="text-[11px] text-slate-500">{hint}</p>
      )}
      {effectiveError && (
        <p id={errorId} className="text-[11px] text-red-300">{effectiveError}</p>
      )}
    </div>
  );
}
