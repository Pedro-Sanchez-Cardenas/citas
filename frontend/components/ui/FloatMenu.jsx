'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

/**
 * FloatMenu - Menú flotante / dropdown usando React Portals.
 *
 * @param {React.ReactNode} children - Elemento que actúa como disparador (trigger).
 * @param {Array} options - Lista de opciones. Cada item puede ser:
 *   - { label: string, onClick?: () => void, disabled?: boolean, icon?: React.ReactNode, divider?: false }
 *   - { divider: true } - para mostrar un separador
 * @param {string} [placement='bottom-start'] - Posición: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
 * @param {string} [className] - Clases extra para el contenedor del trigger.
 */
export default function FloatMenu({ children, options = [], placement = 'bottom-start', className }) {
	const [open, setOpen] = useState(false);
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const triggerRef = useRef(null);
	const menuRef = useRef(null);

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

		// Ajustar para no salir del viewport
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
		// Dar un frame para que el portal monte el menú y tengamos dimensiones
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
		const handleClickOutside = (e) => {
			if (
				triggerRef.current?.contains(e.target) ||
				menuRef.current?.contains(e.target)
			) return;
			setOpen(false);
		};
		const handleEscape = (e) => {
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

	const handleOptionClick = (option) => {
		if (option.divider || option.disabled) return;
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
				option.divider ? (
					<div key={i} className="my-1 border-t border-slate-700/70" role="separator" />
				) : (
					<button
						key={i}
						type="button"
						role="menuitem"
						disabled={option.disabled}
						onClick={() => handleOptionClick(option)}
						className={clsx(
							'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition',
							option.disabled
								? 'cursor-not-allowed text-slate-500'
								: 'text-slate-200 hover:bg-slate-800/80 hover:text-slate-50'
						)}
					>
						{option.icon && <span className="flex shrink-0 text-slate-400">{option.icon}</span>}
						{option.label}
					</button>
				)
			)}
		</div>
	);

	return (
		<div className={clsx('relative inline-block', className)}>
			<div ref={triggerRef} onClick={handleTriggerClick} className="cursor-pointer" aria-haspopup="menu" aria-expanded={open}>
				{children}
			</div>
			{typeof document !== 'undefined' && createPortal(menuContent, document.body)}
		</div>
	);
}
