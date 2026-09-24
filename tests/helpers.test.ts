import { describe, it, expect } from 'vitest';
import {
  generateId,
  PRIORITY_CONFIG,
  CATEGORY_CONFIG,
  STATUS_CONFIG,
  NOTE_COLOR_CONFIG,
} from '../src/utils/helpers';

describe('generateId', () => {
  it('genera un string no vacío', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('genera ids distintos en llamadas consecutivas', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId()));
    // Si hubiera colisiones, el Set tendría menos de 50 elementos
    expect(ids.size).toBe(50);
  });
});

describe('PRIORITY_CONFIG', () => {
  it('tiene exactamente las tres prioridades esperadas', () => {
    expect(Object.keys(PRIORITY_CONFIG).sort()).toEqual(['alta', 'baja', 'media']);
  });

  it('cada prioridad tiene label, color y bg definidos', () => {
    Object.values(PRIORITY_CONFIG).forEach((config) => {
      expect(config.label).toBeTruthy();
      expect(config.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(config.bg).toBeTruthy();
    });
  });
});

describe('CATEGORY_CONFIG', () => {
  it('tiene las seis categorías esperadas', () => {
    expect(Object.keys(CATEGORY_CONFIG).sort()).toEqual(
      ['compras', 'estudio', 'ideas', 'personal', 'salud', 'trabajo']
    );
  });

  it('cada categoría tiene label, color e icon definidos', () => {
    Object.values(CATEGORY_CONFIG).forEach((config) => {
      expect(config.label).toBeTruthy();
      expect(config.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(config.icon).toBeTruthy();
    });
  });
});

describe('STATUS_CONFIG', () => {
  it('tiene los tres estados esperados', () => {
    expect(Object.keys(STATUS_CONFIG).sort()).toEqual(
      ['completada', 'en_progreso', 'pendiente']
    );
  });
});

describe('NOTE_COLOR_CONFIG', () => {
  it('tiene los seis colores de nota esperados', () => {
    expect(Object.keys(NOTE_COLOR_CONFIG).sort()).toEqual(
      ['ambar', 'cielo', 'coral', 'grafito', 'lavanda', 'menta']
    );
  });

  it('cada color tiene sus variantes claro/oscuro y acento definidos', () => {
    Object.values(NOTE_COLOR_CONFIG).forEach((config) => {
      expect(config.name).toBeTruthy();
      expect(config.bgLight).toBeTruthy();
      expect(config.borderLight).toBeTruthy();
      expect(config.bgDark).toBeTruthy();
      expect(config.borderDark).toBeTruthy();
      expect(config.accent).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});