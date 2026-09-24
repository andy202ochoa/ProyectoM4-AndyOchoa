import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTasks } from '../src/hooks/useTasks';

// Simulamos StorageService para que las pruebas no hagan llamadas reales a Firestore.
vi.mock('../src/services', () => ({
  StorageService: {
    getTasks: vi.fn(() => Promise.resolve([])),
    upsertTask: vi.fn(() => Promise.resolve()),
    patchTask: vi.fn(() => Promise.resolve()),
    removeTask: vi.fn(() => Promise.resolve()),
  },
}));

import { StorageService } from '../src/services';

const FAKE_UID = 'test-uid-123';

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('empieza con loading en true y sin tareas', () => {
    const { result } = renderHook(() => useTasks(FAKE_UID));
    expect(result.current.loading).toBe(true);
    expect(result.current.tasks).toEqual([]);
  });

  it('carga las tareas del usuario al montar', async () => {
    const mockTasks = [
      {
        id: 'task-1',
        title: 'Tarea de prueba',
        description: '',
        status: 'pendiente' as const,
        priority: 'media' as const,
        category: 'trabajo' as const,
        subtasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    (StorageService.getTasks as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTasks);

    const { result } = renderHook(() => useTasks(FAKE_UID));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe('Tarea de prueba');
    expect(StorageService.getTasks).toHaveBeenCalledWith(FAKE_UID);
  });

  it('agrega una nueva tarea con addTask', async () => {
    const { result } = renderHook(() => useTasks(FAKE_UID));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addTask({
        title: 'Nueva tarea',
        priority: 'alta',
        category: 'estudio',
      });
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe('Nueva tarea');
    expect(result.current.tasks[0].status).toBe('pendiente');
    expect(StorageService.upsertTask).toHaveBeenCalledWith(
      FAKE_UID,
      expect.objectContaining({ title: 'Nueva tarea' })
    );
  });

  it('elimina una tarea con deleteTask', async () => {
    const { result } = renderHook(() => useTasks(FAKE_UID));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let taskId = '';
    await act(async () => {
      const newTask = await result.current.addTask({
        title: 'Tarea a eliminar',
        priority: 'baja',
        category: 'compras',
      });
      taskId = newTask.id;
    });

    expect(result.current.tasks).toHaveLength(1);

    await act(async () => {
      await result.current.deleteTask(taskId);
    });

    expect(result.current.tasks).toHaveLength(0);
    expect(StorageService.removeTask).toHaveBeenCalledWith(taskId);
  });

  it('alterna el estado de una tarea con toggleTaskStatus', async () => {
    const { result } = renderHook(() => useTasks(FAKE_UID));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let taskId = '';
    await act(async () => {
      const newTask = await result.current.addTask({
        title: 'Tarea a completar',
        priority: 'media',
        category: 'salud',
      });
      taskId = newTask.id;
    });

    expect(result.current.tasks[0].status).toBe('pendiente');

    await act(async () => {
      await result.current.toggleTaskStatus(taskId);
    });

    expect(result.current.tasks[0].status).toBe('completada');
  });

  it('calcula los conteos correctamente', async () => {
    const { result } = renderHook(() => useTasks(FAKE_UID));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addTask({ title: 'A', priority: 'alta', category: 'trabajo' });
      await result.current.addTask({ title: 'B', priority: 'media', category: 'estudio' });
    });

    expect(result.current.counts.total).toBe(2);
    expect(result.current.counts.pendientes).toBe(2);
    expect(result.current.counts.completadas).toBe(0);
  });
});