import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getTodayDateString,
  isOverdue,
  isDueToday,
  formatDueDate,
  formatRelativeTime,
} from '../src/utils/dateUtils';

// Fijamos "hoy" en una fecha conocida para que las pruebas sean deterministas
// (sin esto, pruebas como "mañana" o "hace 2 días" cambiarían de resultado
// dependiendo del día real en que se ejecuten).
const FIXED_NOW = new Date('2026-06-15T12:00:00');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getTodayDateString', () => {
  it('devuelve la fecha de hoy en formato YYYY-MM-DD', () => {
    expect(getTodayDateString()).toBe('2026-06-15');
  });

  it('rellena con ceros mes y día de un solo dígito', () => {
    vi.setSystemTime(new Date('2026-01-05T12:00:00'));
    expect(getTodayDateString()).toBe('2026-01-05');
  });
});

describe('isOverdue', () => {
  it('una tarea pendiente con fecha pasada está vencida', () => {
    expect(isOverdue('2026-06-10', 'pendiente')).toBe(true);
  });

  it('una tarea pendiente con fecha futura no está vencida', () => {
    expect(isOverdue('2026-06-20', 'pendiente')).toBe(false);
  });

  it('una tarea con fecha de hoy no está vencida', () => {
    expect(isOverdue('2026-06-15', 'pendiente')).toBe(false);
  });

  it('una tarea completada nunca está vencida, aunque la fecha haya pasado', () => {
    expect(isOverdue('2026-06-10', 'completada')).toBe(false);
  });

  it('una tarea en progreso con fecha pasada sí está vencida', () => {
    expect(isOverdue('2026-06-10', 'en_progreso')).toBe(true);
  });

  it('sin fecha de vencimiento, nunca está vencida', () => {
    expect(isOverdue(undefined, 'pendiente')).toBe(false);
  });
});

describe('isDueToday', () => {
  it('devuelve true si la fecha es hoy', () => {
    expect(isDueToday('2026-06-15')).toBe(true);
  });

  it('devuelve false si la fecha es otro día', () => {
    expect(isDueToday('2026-06-16')).toBe(false);
  });

  it('devuelve false si no hay fecha', () => {
    expect(isDueToday(undefined)).toBe(false);
  });
});

describe('formatDueDate', () => {
  it('devuelve cadena vacía si no hay fecha', () => {
    expect(formatDueDate(undefined)).toBe('');
  });

  it('devuelve "Hoy" para la fecha actual', () => {
    expect(formatDueDate('2026-06-15')).toBe('Hoy');
  });

  it('devuelve "Mañana" para el día siguiente', () => {
    expect(formatDueDate('2026-06-16')).toBe('Mañana');
  });

  it('devuelve "Ayer" para el día anterior', () => {
    expect(formatDueDate('2026-06-14')).toBe('Ayer');
  });

  it('devuelve "Venció hace Nd" para fechas pasadas (más de 1 día)', () => {
    expect(formatDueDate('2026-06-10')).toBe('Venció hace 5d');
  });

  it('devuelve "En N días" para fechas dentro de la próxima semana', () => {
    expect(formatDueDate('2026-06-19')).toBe('En 4 días');
  });

  it('devuelve día y mes abreviado para fechas más lejanas del mismo año', () => {
    expect(formatDueDate('2026-08-01')).toBe('1 ago');
  });

  it('incluye el año si la fecha es de un año distinto al actual', () => {
    expect(formatDueDate('2027-01-10')).toBe('10 ene 2027');
  });
});

describe('formatRelativeTime', () => {
  it('devuelve "Justo ahora" para menos de 60 segundos', () => {
    const isoString = new Date(FIXED_NOW.getTime() - 30 * 1000).toISOString();
    expect(formatRelativeTime(isoString)).toBe('Justo ahora');
  });

  it('devuelve minutos para menos de una hora', () => {
    const isoString = new Date(FIXED_NOW.getTime() - 15 * 60 * 1000).toISOString();
    expect(formatRelativeTime(isoString)).toBe('Hace 15m');
  });

  it('devuelve horas para menos de un día', () => {
    const isoString = new Date(FIXED_NOW.getTime() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(isoString)).toBe('Hace 3h');
  });

  it('devuelve días para menos de una semana', () => {
    const isoString = new Date(FIXED_NOW.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(isoString)).toBe('Hace 2d');
  });

  it('devuelve fecha formateada para una semana o más', () => {
    const isoString = new Date(FIXED_NOW.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const result = formatRelativeTime(isoString);
    // A partir de los 7 días se usa toLocaleDateString, así que solo
    // confirmamos que ya no tiene el formato "Hace Nd"
    expect(result).not.toMatch(/^Hace \d+d$/);
  });
});