import clsx from 'clsx';
import { useId, useMemo } from 'react';
import type { ChangeEvent } from 'react';

const DEFAULT_FALLBACK = '#14b8a6';

const DEFAULT_PRESETS = [
	'#14b8a6',
	'#0d9488',
	'#22c55e',
	'#3b82f6',
	'#8b5cf6',
	'#ec4899',
	'#f43f5e',
	'#f59e0b',
	'#64748b',
];

function expandShortHex(hex: string): string {
	const h = hex.slice(1);
	if (h.length !== 3) return hex;
	return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
}

/** Devuelve #rrggbb en minúsculas o null si no es un HEX válido para el picker nativo. */
export function parseHexColor(input: string): string | null {
	const t = input.trim();
	if (/^#[0-9A-Fa-f]{6}$/i.test(t)) {
		return t.toLowerCase();
	}
	if (/^#[0-9A-Fa-f]{3}$/i.test(t)) {
		return expandShortHex(t);
	}
	return null;
}

export interface ColorFieldProps {
	id: string;
	label?: string | null;
	value: string;
	onChange: (hex: string) => void;
	hint?: string | null;
	error?: string | null;
	className?: string;
	required?: boolean;
	presets?: string[];
}

export default function ColorField({
	id,
	label,
	value,
	onChange,
	hint,
	error,
	className,
	required,
	presets = DEFAULT_PRESETS,
}: ColorFieldProps) {
	const hintId = hint ? `${id}-hint` : undefined;
	const errorId = error ? `${id}-error` : undefined;
	const presetsLegendId = useId();

	const nativeValue = useMemo(
		() => parseHexColor(value) ?? parseHexColor(DEFAULT_FALLBACK) ?? DEFAULT_FALLBACK,
		[value]
	);
	const previewBg = parseHexColor(value) ?? nativeValue;
	const displayHex = value.trim() || nativeValue;

	const handleNativeChange = (e: ChangeEvent<HTMLInputElement>) => {
		onChange(e.target.value.toLowerCase());
	};

	return (
		<div className={clsx('space-y-1', className)}>
			{label && (
				<label
					className="block text-xs font-medium uppercase tracking-[0.12em] text-slate-400"
					htmlFor={id}
				>
					{label}
					{required && <span className="ml-0.5 text-red-400">*</span>}
				</label>
			)}

			<div
				className={clsx(
					'overflow-hidden rounded-xl border border-white/10 bg-slate-950/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm',
					error && 'border-red-500/50 bg-red-950/20 ring-1 ring-red-500/25'
				)}
			>
				<div className="flex items-center gap-2 p-2 sm:gap-3 sm:p-2.5">
					<div
						className={clsx(
							'relative shrink-0 overflow-hidden rounded-lg border border-white/12 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)]',
							'size-11 sm:size-10',
							'ring-1 ring-white/8 transition hover:ring-teal-400/35 focus-within:ring-2 focus-within:ring-teal-400/45'
						)}
						title="Abrir selector de color"
					>
						<span
							className="absolute inset-0 rounded-[inherit]"
							style={{
								backgroundColor: previewBg,
								boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.12), 0 0 20px -6px ${previewBg}`,
							}}
							aria-hidden
						/>
						<input
							id={id}
							type="color"
							value={nativeValue}
							onChange={handleNativeChange}
							aria-invalid={!!error}
							aria-describedby={error ? errorId : hintId}
							className="absolute inset-0 size-full cursor-pointer opacity-0"
							aria-label={label ? undefined : 'Elegir color'}
						/>
					</div>

					<div className="min-w-0 flex-1">
						<p className="text-[9px] font-medium uppercase tracking-[0.14em] text-slate-500 sm:text-[10px]">
							Valor HEX
						</p>
						<p
							className="truncate font-mono text-xs tabular-nums tracking-tight text-slate-100 sm:text-sm"
							title={displayHex}
						>
							{displayHex}
						</p>
					</div>
				</div>

				{presets.length > 0 && (
					<div className="border-t border-white/8 bg-slate-950/40 px-2 pb-2 pt-1.5 sm:px-2.5 sm:pb-2.5 sm:pt-2">
						<div className="mb-1.5 flex items-center justify-between gap-2 sm:mb-2">
							<p
								id={presetsLegendId}
								className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-[10px]"
							>
								Sugeridos
							</p>
							<span className="inline text-[9px] text-slate-600 sm:hidden">Desliza →</span>
						</div>
						<div
							role="group"
							aria-labelledby={presetsLegendId}
							className={clsx(
								'flex gap-2',
								'max-sm:-mx-1 max-sm:snap-x max-sm:snap-mandatory max-sm:overflow-x-auto max-sm:overflow-y-hidden max-sm:px-1 max-sm:pb-0.5 max-sm:[scrollbar-width:none]',
								'max-sm:[&::-webkit-scrollbar]:hidden',
								'sm:flex-wrap sm:overflow-visible'
							)}
						>
							{presets.map((hex) => {
								const normalized = parseHexColor(hex) ?? hex;
								const active =
									parseHexColor(value)?.toLowerCase() === normalized.toLowerCase() ||
									value.trim().toLowerCase() === hex.trim().toLowerCase();
								return (
									<button
										key={hex}
										type="button"
										onClick={() => onChange(normalized)}
										className={clsx(
											'shrink-0 snap-start rounded-full border transition',
											'size-9 sm:size-8',
											'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
											'active:scale-95',
											active
												? 'z-1 border-white/45 ring-2 ring-teal-400/50 ring-offset-1 ring-offset-slate-950'
												: 'border-white/15 hover:border-white/40 hover:shadow-md hover:shadow-black/30'
										)}
										style={{
											backgroundColor: normalized,
											boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.2)`,
										}}
										title={normalized}
										aria-label={`Aplicar color ${normalized}`}
										aria-pressed={active}
									/>
								);
							})}
						</div>
					</div>
				)}
			</div>

			{hint && !error && (
				<p id={hintId} className="text-[10px] leading-relaxed text-slate-500 sm:text-[11px]">
					{hint}
				</p>
			)}
			{error && (
				<p id={errorId} className="text-[10px] text-red-300 sm:text-[11px]" role="alert">
					{error}
				</p>
			)}
		</div>
	);
}
