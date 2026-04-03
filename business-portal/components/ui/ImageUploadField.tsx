import clsx from 'clsx';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { clientPhotoUrl } from '@/lib/api';

export interface ImageUploadFieldProps {
	id: string;
	label?: string | null;
	value: File | null;
	onChange: (file: File | null) => void;
	accept: string;
	hint?: string | null;
	error?: string | null;
	/** Imagen ya guardada (URL absoluta o ruta `/storage/...`). */
	existingUrl?: string | null;
	/** `square` para logos; `wide` para fondos o banners. */
	aspect?: 'square' | 'wide';
	/** Texto cuando no hay archivo ni imagen remota. */
	emptyDescription?: string;
	disabled?: boolean;
	className?: string;
}

function fileMatchesAccept(file: File, accept: string): boolean {
	if (!accept.trim()) return true;
	const tokens = accept.split(',').map((t) => t.trim().toLowerCase());
	const type = file.type.toLowerCase();
	const name = file.name.toLowerCase();
	for (const token of tokens) {
		if (token === '*/*') return true;
		if (token.endsWith('/*')) {
			const prefix = token.slice(0, -1);
			if (type.startsWith(prefix)) return true;
		} else if (token.startsWith('.')) {
			if (name.endsWith(token)) return true;
		} else if (token === type) {
			return true;
		}
	}
	return false;
}

export default function ImageUploadField({
	id,
	label,
	value,
	onChange,
	accept,
	hint,
	error,
	existingUrl,
	aspect = 'square',
	emptyDescription = 'Arrastra una imagen o haz clic para elegir.',
	disabled,
	className,
}: ImageUploadFieldProps) {
	const hintId = hint ? `${id}-hint` : undefined;
	const errorId = error ? `${id}-error` : undefined;
	const inputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [objectUrl, setObjectUrl] = useState<string | null>(null);

	useEffect(() => {
		if (!value) {
			setObjectUrl((prev) => {
				if (prev) URL.revokeObjectURL(prev);
				return null;
			});
			return;
		}
		const url = URL.createObjectURL(value);
		setObjectUrl((prev) => {
			if (prev) URL.revokeObjectURL(prev);
			return url;
		});
		return () => URL.revokeObjectURL(url);
	}, [value]);

	const remotePreview = clientPhotoUrl(existingUrl?.trim() || null);
	const displaySrc = objectUrl ?? remotePreview;
	const hasNewFile = !!value;
	const hasRemoteOnly = !value && !!remotePreview;

	const pickFiles = useCallback(
		(files: FileList | null) => {
			if (!files?.length || disabled) return;
			const file = files[0];
			if (!fileMatchesAccept(file, accept)) return;
			onChange(file);
		},
		[accept, disabled, onChange]
	);

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		pickFiles(e.target.files);
		e.target.value = '';
	};

	const handleDragOver = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (!disabled) setIsDragging(true);
	};

	const handleDragLeave = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleDrop = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
		if (disabled) return;
		pickFiles(e.dataTransfer.files);
	};

	const clearPick = () => {
		onChange(null);
		if (inputRef.current) inputRef.current.value = '';
	};

	const describeId = useId();
	const labelTextId = useId();
	const describedBy = [describeId, errorId, hintId].filter(Boolean).join(' ') || undefined;

	return (
		<div className={clsx('space-y-1.5', className)}>
			{label && (
				<label
					id={labelTextId}
					className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-slate-400"
					htmlFor={id}
				>
					{label}
				</label>
			)}

			<div
				role="group"
				aria-labelledby={label ? labelTextId : undefined}
				aria-describedby={describedBy}
				className={clsx(
					'p-3 transition',
					isDragging && 'rounded-xl ring-2 ring-teal-400/25',
					error && 'rounded-xl bg-red-950/15 ring-1 ring-red-500/40',
					disabled && 'pointer-events-none opacity-60'
				)}
			>
				<div
					className={clsx(
						'group relative flex min-h-30 w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/15 bg-slate-900/40 text-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] transition',
						'hover:border-teal-400/35 hover:bg-slate-900/55 focus-within:ring-2 focus-within:ring-teal-400/35',
						isDragging && 'border-teal-400/50 bg-slate-900/50',
						error && 'border-red-500/40 bg-red-950/20',
						aspect === 'square' &&
							'mx-auto min-h-30 max-w-44 sm:h-36 sm:min-h-0 sm:w-36 sm:max-w-none',
						aspect === 'wide' && 'min-h-34'
					)}
				>
					<input
						ref={inputRef}
						id={id}
						type="file"
						accept={accept}
						title=""
						aria-labelledby={label ? labelTextId : undefined}
						aria-label={label ? undefined : `Subir imagen: ${emptyDescription}`}
						className={clsx(
							'absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0',
							'focus:outline-none disabled:cursor-not-allowed'
						)}
						disabled={disabled}
						aria-invalid={!!error}
						onChange={handleInputChange}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
					/>

					<div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-3 py-6">
						{displaySrc && (
							<div
								className={clsx(
									'absolute inset-1 overflow-hidden rounded-md ring-1 ring-white/10',
									aspect === 'square' && 'sm:inset-2',
									aspect === 'wide' && 'sm:inset-2'
								)}
							>
								<img
									src={displaySrc}
									alt=""
									className="h-full w-full object-cover"
								/>
								<div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-slate-950/20" />
							</div>
						)}

						<div
							className={clsx(
								'relative z-1 flex w-full max-w-[min(100%,18rem)] flex-col items-center gap-1',
								displaySrc && 'pt-6'
							)}
						>
							<span className="rounded-full border border-white/10 bg-slate-950/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-200/90">
								{hasNewFile
									? 'Nuevo archivo'
									: hasRemoteOnly
										? 'Actual en servidor'
										: 'Sin archivo'}
							</span>
							<span className="text-xs font-medium text-slate-200">
								{displaySrc ? 'Cambiar imagen' : 'Subir imagen'}
							</span>
							<span className="text-[11px] leading-snug text-slate-500">
								{emptyDescription}
							</span>
							{value && (
								<p
									className="mt-1 w-full truncate px-1 text-center font-mono text-[10px] text-slate-400"
									title={value.name}
								>
									{value.name}
								</p>
							)}
							{hasRemoteOnly && !hasNewFile && existingUrl && (
								<p
									className="mt-0.5 line-clamp-2 w-full break-all px-1 text-center font-mono text-[10px] leading-snug text-slate-500"
									title={existingUrl}
								>
									{existingUrl.length > 96
										? `${existingUrl.slice(0, 96)}…`
										: existingUrl}
								</p>
							)}
						</div>
					</div>

					{hasNewFile && (
						<button
							type="button"
							disabled={disabled}
							onClick={(e) => {
								e.stopPropagation();
								clearPick();
							}}
							className="absolute bottom-2 left-1/2 z-30 -translate-x-1/2 rounded-md border border-white/10 bg-slate-950/85 px-2.5 py-1 text-[11px] font-medium text-slate-300 backdrop-blur-sm transition hover:border-teal-400/30 hover:text-slate-100"
						>
							Quitar selección
						</button>
					)}
				</div>
			</div>

			<span id={describeId} className="sr-only">
				Zona de carga con vista previa. Haz clic o arrastra un archivo aquí.
			</span>

			{hint && !error && (
				<p id={hintId} className="text-[11px] text-slate-500">
					{hint}
				</p>
			)}
			{error && (
				<p id={errorId} className="text-[11px] text-red-300" role="alert">
					{error}
				</p>
			)}
		</div>
	);
}
