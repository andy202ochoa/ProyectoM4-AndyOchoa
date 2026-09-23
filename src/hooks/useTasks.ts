import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { PriorityFilter, SubTask, Task, TaskCategory, TaskFilter, TaskPriority, TaskStatus } from '../types';
import { StorageService } from '../services';
import { generateId, isOverdue } from '../utils';

export function useTasks(uid: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const tasksRef = useRef<Task[]>([]);

  const [statusFilter, setStatusFilter] = useState<TaskFilter>('todas');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('todas');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'todas'>('todas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Mantener una referencia siempre actualizada para leer el estado
  // actual dentro de callbacks sin depender de closures viejas
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Cargar las tareas del usuario (filtradas por userId) al montar o si cambia el uid
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    StorageService.getTasks(uid).then((data) => {
      if (cancelled) return;
      setTasks(data);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [uid]);

  // Agregar una nueva tarea
  const addTask = useCallback((taskData: {
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
    StorageService.upsertTask(uid, newTask);
    return newTask;
  }, [uid]);

  // Actualizar una tarea existente
  const updateTask = useCallback(
    (
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

      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
      StorageService.upsertTask(uid, updatedTask);
    },
    [uid]
  );

  // Eliminar una tarea
  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    StorageService.removeTask(id);
  }, []);

  // Alternar estado de la tarea (Pendiente <-> Completada o En Progreso)
  const toggleTaskStatus = useCallback((id: string) => {
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

    setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
    StorageService.upsertTask(uid, updatedTask);
  }, [uid]);

  // Alternar estado de una subtarea
  const toggleSubTask = useCallback((taskId: string, subTaskId: string) => {
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

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
    StorageService.upsertTask(uid, updatedTask);
  }, [uid]);

  // Agregar subtarea directamente
  const addSubTask = useCallback((taskId: string, title: string) => {
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

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
    StorageService.upsertTask(uid, updatedTask);
  }, [uid]);

  // Eliminar subtarea
  const removeSubTask = useCallback((taskId: string, subTaskId: string) => {
    const current = tasksRef.current.find((t) => t.id === taskId);
    if (!current) return;

    const updatedTask: Task = {
      ...current,
      subtasks: current.subtasks.filter((st) => st.id !== subTaskId),
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
    StorageService.upsertTask(uid, updatedTask);
  }, [uid]);

  // Tareas filtradas y ordenadas inteligentemente
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

  // Conteos útiles para la interfaz
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