import { useState, useEffect, useMemo, useCallback } from 'react';
import { PriorityFilter, SubTask, Task, TaskCategory, TaskFilter, TaskPriority, TaskStatus } from '../types';
import { StorageService } from '../services';
import { generateId, isOverdue } from '../utils';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => StorageService.getTasks());
  const [statusFilter, setStatusFilter] = useState<TaskFilter>('todas');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('todas');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'todas'>('todas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sincronizar automáticamente con localStorage
  useEffect(() => {
    StorageService.saveTasks(tasks);
  }, [tasks]);

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
    return newTask;
  }, []);

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
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const updatedSubtasks: SubTask[] = updates.subtasks
            ? updates.subtasks.map((st) => ({
                id: st.id || generateId(),
                title: st.title.trim(),
                completed: st.completed || false,
              }))
            : t.subtasks;

          return {
            ...t,
            ...updates,
            subtasks: updatedSubtasks,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    []
  );

  // Eliminar una tarea
  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Alternar estado de la tarea (Pendiente <-> Completada o En Progreso)
  const toggleTaskStatus = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const newStatus: TaskStatus = t.status === 'completada' ? 'pendiente' : 'completada';
        // Si se completa la tarea, marcar también todas sus subtareas como completadas
        const updatedSubtasks =
          newStatus === 'completada'
            ? t.subtasks.map((st) => ({ ...st, completed: true }))
            : t.subtasks;

        return {
          ...t,
          status: newStatus,
          subtasks: updatedSubtasks,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  // Alternar estado de una subtarea
  const toggleSubTask = useCallback((taskId: string, subTaskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;

        const updatedSubtasks = task.subtasks.map((st) =>
          st.id === subTaskId ? { ...st, completed: !st.completed } : st
        );

        // Si todas las subtareas están completadas, podemos sugerir o actualizar el estado
        const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.completed);
        const newStatus: TaskStatus = allCompleted ? 'completada' : task.status === 'completada' ? 'en_progreso' : task.status;

        return {
          ...task,
          subtasks: updatedSubtasks,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  // Agregar subtarea directamente
  const addSubTask = useCallback((taskId: string, title: string) => {
    if (!title.trim()) return;
    const newSub: SubTask = {
      id: generateId(),
      title: title.trim(),
      completed: false,
    };
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: [...t.subtasks, newSub],
              status: t.status === 'completada' ? 'en_progreso' : t.status,
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  }, []);

  // Eliminar subtarea
  const removeSubTask = useCallback((taskId: string, subTaskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.filter((st) => st.id !== subTaskId),
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  }, []);

  // Tareas filtradas y ordenadas inteligentemente
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Filtro de estado
        if (statusFilter !== 'todas' && task.status !== statusFilter) return false;

        // Filtro de prioridad
        if (priorityFilter !== 'todas' && task.priority !== priorityFilter) return false;

        // Filtro de categoría
        if (categoryFilter !== 'todas' && task.category !== categoryFilter) return false;

        // Filtro de búsqueda
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
        // 1. Tareas completadas siempre al final
        if (a.status === 'completada' && b.status !== 'completada') return 1;
        if (a.status !== 'completada' && b.status === 'completada') return -1;

        // 2. Tareas vencidas primero para llamar la atención
        const aOverdue = isOverdue(a.dueDate, a.status);
        const bOverdue = isOverdue(b.dueDate, b.status);
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        // 3. Prioridad (alta > media > baja)
        const priorityWeight = { alta: 3, media: 2, baja: 1 };
        if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
          return priorityWeight[b.priority] - priorityWeight[a.priority];
        }

        // 4. Fecha de vencimiento más cercana
        if (a.dueDate && b.dueDate) {
          return a.dueDate.localeCompare(b.dueDate);
        }
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;

        // 5. Creación más reciente
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
