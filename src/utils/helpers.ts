import { NoteColor, TaskCategory, TaskPriority, TaskStatus } from '../types';

/**
 * Genera un identificador único seguro
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

/**
 * Metadatos para prioridades de tarea
 */
export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  alta: {
    label: 'Alta',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
  },
  media: {
    label: 'Media',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
  },
  baja: {
    label: 'Baja',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
  },
};

/**
 * Metadatos para categorías de tarea
 */
export const CATEGORY_CONFIG: Record<TaskCategory, { label: string; color: string; icon: string }> = {
  trabajo: { label: 'Trabajo', color: '#6366f1', icon: '💼' },
  personal: { label: 'Personal', color: '#ec4899', icon: '👤' },
  estudio: { label: 'Estudio', color: '#8b5cf6', icon: '📚' },
  ideas: { label: 'Ideas', color: '#06b6d4', icon: '💡' },
  compras: { label: 'Compras', color: '#10b981', icon: '🛒' },
  salud: { label: 'Salud', color: '#f43f5e', icon: '❤️' },
};

/**
 * Metadatos para estados de tarea
 */
export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: '#94a3b8' },
  en_progreso: { label: 'En Progreso', color: '#3b82f6' },
  completada: { label: 'Completada', color: '#10b981' },
};

/**
 * Metadatos y variables para colores de notas
 */
export const NOTE_COLOR_CONFIG: Record<
  NoteColor,
  { name: string; bgLight: string; borderLight: string; bgDark: string; borderDark: string; accent: string }
> = {
  menta: {
    name: 'Menta',
    bgLight: '#ecfdf5',
    borderLight: '#a7f3d0',
    bgDark: 'rgba(16, 185, 129, 0.15)',
    borderDark: 'rgba(16, 185, 129, 0.35)',
    accent: '#10b981',
  },
  lavanda: {
    name: 'Lavanda',
    bgLight: '#f5f3ff',
    borderLight: '#ddd6fe',
    bgDark: 'rgba(139, 92, 246, 0.15)',
    borderDark: 'rgba(139, 92, 246, 0.35)',
    accent: '#8b5cf6',
  },
  coral: {
    name: 'Coral',
    bgLight: '#fff1f2',
    borderLight: '#fecdd3',
    bgDark: 'rgba(244, 63, 94, 0.15)',
    borderDark: 'rgba(244, 63, 94, 0.35)',
    accent: '#f43f5e',
  },
  cielo: {
    name: 'Cielo',
    bgLight: '#f0f9ff',
    borderLight: '#bae6fd',
    bgDark: 'rgba(14, 165, 233, 0.15)',
    borderDark: 'rgba(14, 165, 233, 0.35)',
    accent: '#0ea5e9',
  },
  ambar: {
    name: 'Ámbar',
    bgLight: '#fffbeb',
    borderLight: '#fde68a',
    bgDark: 'rgba(245, 158, 11, 0.15)',
    borderDark: 'rgba(245, 158, 11, 0.35)',
    accent: '#f59e0b',
  },
  grafito: {
    name: 'Grafito',
    bgLight: '#f8fafc',
    borderLight: '#cbd5e1',
    bgDark: 'rgba(30, 41, 59, 0.8)',
    borderDark: 'rgba(71, 85, 105, 0.5)',
    accent: '#64748b',
  },
};
