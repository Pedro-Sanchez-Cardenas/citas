import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

// Estilo alineado con el “theme” oscuro y acentos teal del sistema.
const swal = Swal.mixin({
  background: '#0f172a', // slate-900
  color: '#e2e8f0', // slate-200
  iconColor: '#2dd4bf', // teal-300
  toast: false,
  buttonsStyling: false,
  allowOutsideClick: false,
  confirmButtonColor: '#14b8a6', // teal-500
  cancelButtonColor: '#64748b', // slate-500
  customClass: {
    popup: 'swal2-popup',
    confirmButton: 'swal2-confirm',
    cancelButton: 'swal2-cancel',
    title: 'swal2-title',
    htmlContainer: 'swal2-html-container',
  },
});

function resolveMessage(maybe: unknown): string | undefined {
  if (!maybe) return undefined;
  if (typeof maybe === 'string') return maybe;
  if (typeof maybe === 'object' && maybe && 'message' in maybe) {
    const msg = (maybe as any).message;
    return typeof msg === 'string' ? msg : undefined;
  }
  return undefined;
}

export async function swalSuccess(
  title = 'Guardado correcto',
  text?: string
): Promise<void> {
  await swal.fire({
    icon: 'success',
    title,
    text,
    timer: text ? 3500 : 2500,
    showConfirmButton: false,
  });
}

export async function swalError(
  title = 'Error',
  text?: string
): Promise<void> {
  await swal.fire({
    icon: 'error',
    title,
    text,
  });
}

export async function swalInfo(
  title = 'Información',
  text?: string
): Promise<void> {
  await swal.fire({
    icon: 'info',
    title,
    text,
  });
}

export async function swalConfirm(
  options: {
    title: string;
    text?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    icon?: 'warning' | 'question';
  }
): Promise<boolean> {
  const result = await swal.fire({
    icon: options.icon ?? 'warning',
    title: options.title,
    text: options.text,
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText ?? 'Confirmar',
    cancelButtonText: options.cancelButtonText ?? 'Cancelar',
  });

  return result.isConfirmed === true;
}

export function swalSilentErrorText(err: unknown): string {
  return (
    resolveMessage((err as any)?.response?.data) ||
    resolveMessage(err) ||
    'Ocurrió un error. Inténtalo nuevamente.'
  );
}

