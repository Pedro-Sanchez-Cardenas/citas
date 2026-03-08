import clsx from 'clsx';

/**
 * Casilla de verificación con etiqueta opcional.
 *
 * @param {string} [label] - Texto visible junto al checkbox
 * @param {string} [className] - Clases del contenedor <label>
 * @param {Object} [props] - Resto de atributos nativos de <input type="checkbox"> (checked, onChange, disabled, name, etc.)
 */
export default function Checkbox({ label, className, ...props }) {
  return (
    <label className={clsx('inline-flex items-center gap-2 text-xs text-slate-300', className)}>
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-teal-400 focus:ring-teal-500/60 focus:ring-offset-slate-950"
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  );
}

