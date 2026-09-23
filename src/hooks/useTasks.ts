import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { PriorityFilter, SubTask, Task, TaskCategory, TaskFilter, TaskPriority, TaskStatus } from '../types';
import { StorageService } from '../services';
import { generateId, isOverdue } from '../utils';

export function useTasks(uid: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tasksRef = useRef<Task[]>([]);

  const [statusFilter, setStatusFilter] = useState<TaskFilter>('todas');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('todas');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'todas'>('todas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // 🔥 CARGA INICIAL CON MANEJO DE ERRORES
  useEffect(() => {
    let cancelled = false;

    const loadTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await StorageService.getTasks(uid);

        if (!cancelled) {
          setTasks(data);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError('No se pudieron cargar las tareas');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTasks();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  // 🔥 ADD CON ROLLBACK
  const addTask = useCallback(async (taskData: {
    title: string;
    description?: string;
    priority: TaskPriority;
    category: TaskCategory;
    dueDate?: string;
    subtasks?: { title: string; completed: boolean }[];
  }) => {
    const newTask: Task = {
      id: generateId(),
      title: taskData.title.trim(),
      description: taskData.description?.trim() || '',
      status: 'pendiente',
      priority: taskData.priority,
      category: taskData.category,
      dueDate: taskData.dueDate || undefined,
      subtasks: (taskData.subtasks || []).map((st) => ({
        id: generateId(),
        title: st.title.trim(),
        completed: st.completed || false,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);

    try {
      await StorageService.upsertTask(uid, newTask);
      return newTask;
    } catch (err) {
      console.error(err);

      // rollback
      setTasks((prev) => prev.filter((t) => t.id !== newTask.id));
      setError('No se pudo guardar la tarea');

      throw err;
    }
  }, [uid]);

  // 🔥 UPDATE CON ROLLBACK
  const updateTask = useCallback(
    async (
      id: string,
      updates: {
        title?: string;
        description?: string;
        priority?: TaskPriority;
        category?: TaskCategory;
        dueDate?: string;
        status?: TaskStatus;
        subtasks?: { id?: string; title: string; completed: boolean }[];
      }
    ) => {
      const current = tasksRef.current.find((t) => t.id === id);
      if (!current) return;

      const updatedSubtasks: SubTask[] = updates.subtasks
        ? updates.subtasks.map((st) => ({
            id: st.id || generateId(),
            title: st.title.trim(),
            completed: st.completed || false,
          }))
        : current.subtasks;

      const updatedTask: Task = {
        ...current,
        ...updates,
        subtasks: updatedSubtasks,
        updatedAt: new Date().toISOString(),
      };

      const previous = current;

      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));

      try {
        await StorageService.upsertTask(uid, updatedTask);
      } catch (err) {
        console.error(err);

        // rollback
        setTasks((prev) => prev.map((t) => (t.id === id ? previous : t)));
        setError('No se pudo actualizar la tarea');
      }
    },
    [uid]
  );

  // 🔥 DELETE CON ROLLBACK
  const deleteTask = useCallback(async (id: string) => {
    const previous = tasksRef.current;

    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await StorageService.removeTask(id);
    } catch (err) {
      console.error(err);

      // rollback
      setTasks(previous);
      setError('No se pudo eliminar la tarea');
    }
  }, []);

  const toggleTaskStatus = useCallback(async (id: string) => {
    const current = tasksRef.current.find((t) => t.id === id);
    if (!current) return;

    const newStatus: TaskStatus = current.status === 'completada' ? 'pendiente' : 'completada';
    const updatedSubtasks =
      newStatus === 'completada'
        ? current.subtasks.map((st) => ({ ...st, completed: true }))
        : current.subtasks;

    const updatedTask: Task = {
      ...current,
      status: newStatus,
      subtasks: updatedSubtasks,
      updatedAt: new Date().toISOString(),
    };

    const previous = current;

    setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));

    try {
      await StorageService.upsertTask(uid, updatedTask);
    } catch (err) {
      console.error(err);
      setTasks((prev) => prev.map((t) => (t.id === id ? previous : t)));
      setError('No se pudo actualizar el estado');
    }
  }, [uid]);

  const toggleSubTask = useCallback(async (taskId: string, subTaskId: string) => {
    const current = tasksRef.current.find((t) => t.id === taskId);
    if (!current) return;

    const updatedSubtasks = current.subtasks.map((st) =>
      st.id === subTaskId ? { ...st, completed: !st.completed } : st
    );

    const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.completed);
    const newStatus: TaskStatus = allCompleted
      ? 'completada'
      : current.status === 'completada'
      ? 'en_progreso'
      : current.status;

    const updatedTask: Task = {
      ...current,
      subtasks: updatedSubtasks,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    const previous = current;

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

    try {
      await StorageService.upsertTask(uid, updatedTask);
    } catch (err) {
      console.error(err);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? previous : t)));
      setError('No se pudo actualizar la subtarea');
    }
  }, [uid]);

  const addSubTask = useCallback(async (taskId: string, title: string) => {
    if (!title.trim()) return;

    const current = tasksRef.current.find((t) => t.id === taskId);
    if (!current) return;

    const newSub: SubTask = {
      id: generateId(),
      title: title.trim(),
      completed: false,
    };

    const updatedTask: Task = {
      ...current,
      subtasks: [...current.subtasks, newSub],
      status: current.status === 'completada' ? 'en_progreso' : current.status,
      updatedAt: new Date().toISOString(),
    };

    const previous = current;

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

    try {
      await StorageService.upsertTask(uid, updatedTask);
    } catch (err) {
      console.error(err);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? previous : t)));
      setError('No se pudo agregar la subtarea');
    }
  }, [uid]);

  const removeSubTask = useCallback(async (taskId: string, subTaskId: string) => {
    const current = tasksRef.current.find((t) => t.id === taskId);
    if (!current) return;

    const updatedTask: Task = {
      ...current,
      subtasks: current.subtasks.filter((st) => st.id !== subTaskId),
      updatedAt: new Date().toISOString(),
    };

    const previous = current;

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

    try {
      await StorageService.upsertTask(uid, updatedTask);
    } catch (err) {
      console.error(err);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? previous : t)));
      setError('No se pudo eliminar la subtarea');
    }
  }, [uid]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (statusFilter !== 'todas' && task.status !== statusFilter) return false;
        if (priorityFilter !== 'todas' && task.priority !== priorityFilter) return false;
        if (categoryFilter !== 'todas' && task.category !== categoryFilter) return false;

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(query);
          const matchDesc = (task.description || '').toLowerCase().includes(query);
          const matchSub = task.subtasks.some((st) => st.title.toLowerCase().includes(query));
          if (!matchTitle && !matchDesc && !matchSub) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.status === 'completada' && b.status !== 'completada') return 1;
        if (a.status !== 'completada' && b.status === 'completada') return -1;

        const aOverdue = isOverdue(a.dueDate, a.status);
        const bOverdue = isOverdue(b.dueDate, b.status);
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        const priorityWeight = { alta: 3, media: 2, baja: 1 };
        if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
          return priorityWeight[b.priority] - priorityWeight[a.priority];
        }

        if (a.dueDate && b.dueDate) {
          return a.dueDate.localeCompare(b.dueDate);
        }
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [tasks, statusFilter, priorityFilter, categoryFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      total: tasks.length,
      pendientes: tasks.filter((t) => t.status === 'pendiente').length,
      en_progreso: tasks.filter((t) => t.status === 'en_progreso').length,
      completadas: tasks.filter((t) => t.status === 'completada').length,
      activas: tasks.filter((t) => t.status !== 'completada').length,
    };
  }, [tasks]);

  return {
    tasks,
    loading,
    error,
    filteredTasks,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    toggleSubTask,
    addSubTask,
    removeSubTask,
    counts,
  };
}