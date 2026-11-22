import { Task, TaskCategory, TaskPriority } from '../types';
import { CATEGORY_CONFIG, PRIORITY_CONFIG, STATUS_CONFIG } from './helpers';
import { isOverdue } from './dateUtils';

export interface TaskSummary {
  subject: string;
  text: string;
}

/** Máximo de tareas que se listan una por una en el correo */
export const MAX_TASKS_IN_SUMMARY = 50;

/**
 * Construye el resumen del estado de todas las tareas (asunto + cuerpo en texto).
 * Es una función pura: no depende de React ni de servicios externos, así que
 * se puede testear fácilmente.
 */
export function buildTaskSummary(tasks: Task[], now: Date = new Date()): TaskSummary {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completada').length;
  const pending = tasks.filter((t) => t.status === 'pendiente').length;
  const inProgress = tasks.filter((t) => t.status === 'en_progreso').length;
  const overdue = tasks.filter((t) => isOverdue(t.dueDate, t.status));
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const byCategory = (Object.keys(CATEGORY_CONFIG) as TaskCategory[]).map((cat) => {
    const count = tasks.filter((t) => t.category === cat).length;
    return `- ${CATEGORY_CONFIG[cat].label}: ${count}`;
  });

  const byPriority = (['alta', 'media', 'baja'] as TaskPriority[]).map((p) => {
    const count = tasks.filter((t) => t.priority === p).length;
    return `- ${PRIORITY_CONFIG[p].label}: ${count}`;
  });

  const taskLines = tasks
    .slice(0, MAX_TASKS_IN_SUMMARY)
    .map((t) => `- [${STATUS_CONFIG[t.status].label}] ${t.title}${isOverdue(t.dueDate, t.status) ? ' (vencida)' : ''}`);
  if (total > MAX_TASKS_IN_SUMMARY) {
    taskLines.push(`... y ${total - MAX_TASKS_IN_SUMMARY} tareas más`);
  }

  const lines = [
    'RESUMEN DE TAREAS — TaskFlow',
    `Generado el ${now.toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    '',
    `Índice de productividad: ${completionRate}% (${completed}/${total} completadas)`,
    `Pendientes: ${pending}`,
    `En progreso: ${inProgress}`,
    `Completadas: ${completed}`,
    `Vencidas: ${overdue.length}`,
    '',
    'POR CATEGORÍA',
    ...byCategory,
    '',
    'POR PRIORIDAD',
    ...byPriority,
    '',
    'TODAS LAS TAREAS',
    ...(total > 0 ? taskLines : ['No tienes tareas registradas.']),
  ];

  return {
    subject: `Resumen de tareas — ${completionRate}% completado`,
    text: lines.join('\n'),
  };
}
