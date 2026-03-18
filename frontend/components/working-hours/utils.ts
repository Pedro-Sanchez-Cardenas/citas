export const WEEKDAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

/** Etiquetas cortas para selector visual de días (Lun, Mar, …). */
export const WEEKDAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Presets de horario para elegir rápido. */
export const TIME_PRESETS = [
  { label: 'Mañana', start: '09:00', end: '14:00' },
  { label: 'Tarde', start: '14:00', end: '20:00' },
  { label: 'Día completo', start: '09:00', end: '18:00' },
] as const;
