import clsx from 'clsx';

/**
 * Campo de texto nativo con label, hint y mensaje de error.
 *
 * @param {string} [label] - Etiqueta visible sobre el input
 * @param {string} [hint] - Texto de ayuda debajo del input (no se muestra si hay error)
 * @param {string} [error] - Mensaje de error; si existe, se muestra en rojo y el input en estado error
 * @param {string} [className] - Clases del contenedor exterior
 * @param {string} [inputClassName] - Clases aplicadas al <input>
 * @param {boolean} [required] - Marca el campo como obligatorio (asterisco y atributo required)
 * @param {Object} [props] - Resto de atributos nativos de <input> (id, type, value, onChange, placeholder, etc.)
 */
export default function Input({
  label,
  hint,
  error,
  className,
  inputClassName,
  required,
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
          {label}
          {required && <span className="ml-0.5 text-red-400">*</span>}
        </label>
      )}
      <input
        className={clsx(
          'w-full rounded-xl border border-slate-700/70 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-50 outline-none ring-0 transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50',
          error && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/40',
          inputClassName
        )}
        aria-invalid={!!error}
        aria-describedby={hint ? `${props.id}-hint` : undefined}
        required={required}
        {...props}
      />
      {hint && !error && (
        <p id={`${props.id}-hint`} className="mt-1 text-[11px] text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-1 text-[11px] text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

