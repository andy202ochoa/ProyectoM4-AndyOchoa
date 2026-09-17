export type TaskPriority = 'baja' | 'media' | 'alta';

export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada';

export type TaskCategory = 
  | 'trabajo' 
  | 'personal' 
  | 'estudio' 
  | 'ideas' 
  | 'compras' 
  | 'salud';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: string; // ISO date string YYYY-MM-DD
  subtasks: SubTask[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export type TaskFilter = 'todas' | 'pendiente' | 'en_progreso' | 'completada';
export type PriorityFilter = 'todas' | TaskPriority;
