import { TaskStatus } from '../types';

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Comprueba si una tarea está vencida respecto a hoy
 */
export function isOverdue(dueDate?: string, status?: TaskStatus): boolean {
  if (!dueDate || status === 'completada') return false;

  const today = getTodayDateString();
  return dueDate < today;
}

/**
 * Comprueba si la fecha corresponde al día de hoy
 */
export function isDueToday(dueDate?: string): boolean {
  if (!dueDate) return false;
  return dueDate === getTodayDateString();
}

/**
 * Formatea una fecha de vencimiento a formato amigable en español
 */
export function formatDueDate(dateString?: string): string {
  if (!dateString) return '';

  const [yearStr, monthStr, dayStr] = dateString.split('-');
  if (!yearStr || !monthStr || !dayStr) return dateString;

  const date = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Mañana';
  if (diffDays === -1) return 'Ayer';
  if (diffDays < -1) return `Venció hace ${Math.abs(diffDays)}d`;
  if (diffDays > 1 && diffDays <= 6) return `En ${diffDays} días`;

  const meses = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
  ];

  const currentYear = today.getFullYear();
  const formattedMonth = meses[date.getMonth()];

  if (date.getFullYear() === currentYear) {
    return `${date.getDate()} ${formattedMonth}`;
  }

  return `${date.getDate()} ${formattedMonth} ${date.getFullYear()}`;
}

/**
 * Formatea un timestamp ISO relativo ("hace 5 min", "hace 2 horas", "hace 3 días")
 */
export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Justo ahora';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Hace ${diffMin}m`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `Hace ${diffHour}h`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 7) return `Hace ${diffDays}d`;

  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
