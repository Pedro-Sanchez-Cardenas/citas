'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import type { ReactNode } from 'react';

export type FloatMenuPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

export interface FloatMenuOption {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  divider?: false;
}

export interface FloatMenuDivider {
  divider: true;
}

export type FloatMenuOptionItem = FloatMenuOption | FloatMenuDivider;

export interface FloatMenuProps {
  children: ReactNode;
  options?: FloatMenuOptionItem[];
  placement?: FloatMenuPlacement;
  className?: string;
}

export default function FloatMenu({
  children,
  options = [],
  placement = 'bottom-start',
  className,
}: FloatMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 4;
    const menuHeight = menuRef.current?.offsetHeight ?? 200;
    const menuWidth = menuRef.current?.offsetWidth ?? 180;
    const viewport = { w: window.innerWidth, h: window.innerHeight };

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'bottom-end':
        top = rect.bottom + gap;
        left = Math.min(rect.right - menuWidth, viewport.w - menuWidth - 8);
        break;
      case 'top-start':
        top = rect.top - (menuRef.current?.offsetHeight ?? menuHeight) - gap;
        left = rect.left;
        break;
      case 'top-end':
        top = rect.top - (menuRef.current?.offsetHeight ?? menuHeight) - gap;
        left = Math.min(rect.right - menuWidth, viewport.w - menuWidth - 8);
        break;
      case 'bottom-start':
      default:
        top = rect.bottom + gap;
        left = rect.left;
        break;
    }

    left = Math.max(8, Math.min(left, viewport.w - menuWidth - 8));
    if (placement.startsWith('bottom') && top + (menuRef.current?.offsetHeight ?? menuHeight) > viewport.h - 8) {
      top = rect.top - (menuRef.current?.offsetHeight ?? menuHeight) - gap;
    } else if (placement.startsWith('top') && top < 8) {
      top = rect.bottom + gap;
    }

    setPosition({ top, left });
  };

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const id = requestAnimationFrame(() => {
      updatePosition();
    });
    const ro = new ResizeObserver(updatePosition);
    ro.observe(triggerRef.current);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [open, placement]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleTriggerClick = () => setOpen((prev) => !prev);

  const handleOptionClick = (option: FloatMenuOptionItem) => {
    if ('divider' in option && option.divider) return;
    if (option.disabled) return;
    option.onClick?.();
    setOpen(false);
  };

  const menuContent = open && (
    <div
      ref={menuRef}
      className="fixed z-100 min-w-40 rounded-xl border border-slate-800 bg-slate-950/95 py-1 shadow-xl backdrop-blur-sm"
      style={{ top: position.top, left: position.left }}
      role="menu"
      aria-orientation="vertical"
    >
      {options.map((option, i) =>
        'divider' in option && option.divider ? (
          <div key={i} className="my-1 border-t border-slate-700/70" role="separator" />
        ) : (
          <button
            key={i}
            type="button"
            role="menuitem"
            disabled={'disabled' in option ? option.disabled : false}
            onClick={() => handleOptionClick(option)}
            className={clsx(
              'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition',
              'disabled' in option && option.disabled
                ? 'cursor-not-allowed text-slate-500'
                : 'text-slate-200 hover:bg-slate-800/80 hover:text-slate-50'
            )}
          >
            {'icon' in option && option.icon && (
              <span className="flex shrink-0 text-slate-400">{option.icon}</span>
            )}
            {'label' in option && option.label}
          </button>
        )
      )}
    </div>
  );

  return (
    <div className={clsx('relative inline-block', className)}>
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        className="cursor-pointer"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {children}
      </div>
      {typeof document !== 'undefined' && createPortal(menuContent, document.body)}
    </div>
  );
}
