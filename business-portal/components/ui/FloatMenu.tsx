'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';

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
  const [position, setPosition] = useState({ top: 0, left: 0, maxHeight: 320 });
  const menuId = useId();
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const safeMargin = 8;
    const gap = 6;
    const menuHeight = Math.min(menuRef.current?.scrollHeight ?? menuRef.current?.offsetHeight ?? 200, 320);
    const menuWidth = menuRef.current?.offsetWidth ?? 180;
    const viewport = { w: window.innerWidth, h: window.innerHeight };
    const preferTop = placement.startsWith('top');
    const preferEnd = placement.endsWith('end');
    const spaceBelow = viewport.h - rect.bottom - gap - safeMargin;
    const spaceAbove = rect.top - gap - safeMargin;

    const openUp = preferTop ? spaceAbove > 120 || spaceAbove >= spaceBelow : spaceBelow < menuHeight && spaceAbove > spaceBelow;
    const availableSpace = openUp ? spaceAbove : spaceBelow;
    const maxHeight = Math.max(120, Math.min(320, availableSpace));
    const renderedHeight = Math.min(maxHeight, menuHeight);

    const spaceRight = viewport.w - rect.left - safeMargin;
    const spaceLeft = rect.right - safeMargin;
    const canOpenStart = spaceRight >= menuWidth;
    const canOpenEnd = spaceLeft >= menuWidth;
    const openEnd = preferEnd
      ? canOpenEnd || !canOpenStart
      : !(canOpenStart || !canOpenEnd);

    let left = openEnd ? rect.right - menuWidth : rect.left;
    left = Math.max(safeMargin, Math.min(left, viewport.w - menuWidth - safeMargin));

    const top = openUp
      ? Math.max(safeMargin, rect.top - gap - renderedHeight)
      : Math.min(viewport.h - safeMargin - renderedHeight, rect.bottom + gap);

    setPosition({ top, left, maxHeight });
  };

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const id = requestAnimationFrame(() => {
      updatePosition();
    });
    const ro = new ResizeObserver(updatePosition);
    ro.observe(triggerRef.current);
    const handleResize = () => updatePosition();
    const handleScroll = () => setOpen(false);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
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
  const handleTriggerKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  };

  const handleOptionClick = (option: FloatMenuOptionItem) => {
    if ('divider' in option && option.divider) return;
    if (option.disabled) return;
    option.onClick?.();
    setOpen(false);
  };

  const actionableIndexes = options.reduce<number[]>((acc, option, idx) => {
    if (!('divider' in option && option.divider)) acc.push(idx);
    return acc;
  }, []);
  const firstActionableIndex = actionableIndexes[0] ?? -1;
  const lastActionableIndex = actionableIndexes[actionableIndexes.length - 1] ?? -1;

  const menuContent = open && (
    <div
      ref={menuRef}
      className="fixed z-100 min-w-40 rounded-xl border border-white/12 bg-slate-900/70 p-1 shadow-(--shadow-modal) backdrop-blur-xl backdrop-saturate-150"
      style={{ top: position.top, left: position.left, maxHeight: position.maxHeight }}
      role="menu"
      id={menuId}
      aria-orientation="vertical"
    >
      {options.map((option, i) =>
        'divider' in option && option.divider ? (
          <div key={i} className="my-1 border-t border-white/8" role="separator" />
        ) : (
          <button
            key={i}
            type="button"
            role="menuitem"
            disabled={'disabled' in option ? option.disabled : false}
            onClick={() => handleOptionClick(option)}
            className={clsx(
              'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition',
              i === firstActionableIndex && 'rounded-t-lg',
              i === lastActionableIndex && 'rounded-b-lg',
              'disabled' in option && option.disabled
                ? 'cursor-not-allowed text-slate-500'
                : 'text-slate-200 hover:bg-white/8 hover:text-slate-50 active:bg-white/6'
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
        onKeyDown={handleTriggerKeyDown}
        className="cursor-pointer"
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
      >
        {children}
      </div>
      {typeof document !== 'undefined' && createPortal(menuContent, document.body)}
    </div>
  );
}
