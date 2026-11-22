import { describe, it, expect } from 'vitest';
import { buildTaskSummary, MAX_TASKS_IN_SUMMARY } from '../src/utils/taskSummary';
import type { Task } from '../src/types';

const makeTask = (overrides: Partial<Task>): Task => ({
  id: 'id',
  title: 'Tarea',
  status: 'pendiente',
  priority: 'media',
  category: 'trabajo',
  subtasks: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('buildTaskSummary', () => {
  it('calcula el porcentaje completado y lo pone en el asunto', () => {
    const tasks = [
      makeTask({ id: '1', title: 'Hecha', status: 'completada' }),
      makeTask({ id: '2', title: 'Pendiente' }),
    ];

    const summary = buildTaskSummary(tasks);

    expect(summary.subject).toBe('Resumen de tareas — 50% completado');
    expect(summary.text).toContain('Completadas: 1');
    expect(summary.text).toContain('Pendientes: 1');
  });

  it('lista cada tarea con su estado', () => {
    const summary = buildTaskSummary([
      makeTask({ title: 'Estudiar React', status: 'en_progreso' }),
    ]);

    expect(summary.text).toContain('- [En Progreso] Estudiar React');
  });

  it('marca como vencidas las tareas con fecha pasada no completadas', () => {
    const summary = buildTaskSummary([
      makeTask({ title: 'Pagar luz', dueDate: '2020-01-01' }),
    ]);

    expect(summary.text).toContain('Vencidas: 1');
    expect(summary.text).toContain('Pagar luz (vencida)');
  });

  it('caso borde: sin tareas muestra 0% y un mensaje', () => {
    const summary = buildTaskSummary([]);

    expect(summary.subject).toBe('Resumen de tareas — 0% completado');
    expect(summary.text).toContain('No tienes tareas registradas.');
  });

  it('limita la cantidad de tareas listadas', () => {
    const tasks = Array.from({ length: MAX_TASKS_IN_SUMMARY + 5 }, (_, i) =>
      makeTask({ id: String(i), title: `Tarea ${i}` })
    );

    const summary = buildTaskSummary(tasks);

    expect(summary.text).toContain('... y 5 tareas más');
  });
});
