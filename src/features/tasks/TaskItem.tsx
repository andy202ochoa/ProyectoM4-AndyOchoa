import React, { useState } from 'react';
import { Task } from '../../types';
import { formatDueDate, isDueToday, isOverdue } from '../../utils';
import { CalendarIcon, CheckIcon, CircleIcon, EditIcon, TrashIcon } from '../../components/common/Icons';
import { CategoryBadge, PriorityBadge } from '../../components/common/Badge';
import './TaskItem.css';

interface TaskItemProps {
  task: Task;
  onToggleStatus: (id: string) => void;
  onToggleSubTask: (taskId: string, subTaskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleStatus,
  onToggleSubTask,
  onEdit,
  onDelete,
}) => {
  const [showSubtasks, setShowSubtasks] = useState(false);

  const isDone = task.status === 'completada';
  const overdue = isOverdue(task.dueDate, task.status);
  const dueToday = isDueToday(task.dueDate) && !isDone;

  const totalSubs = task.subtasks.length;
  const completedSubs = task.subtasks.filter((s) => s.completed).length;
  const subPercent = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;

  return (
    <div className={`task-item-card ${isDone ? 'is-done' : ''}`}>
      {/* Fila Principal: Checkbox + Título + Acciones */}
      <div className="task-item-main-row">
        {/* Botón Checkbox Interactivo */}
        <button
          type="button"
          onClick={() => onToggleStatus(task.id)}
          aria-label={isDone ? 'Marcar como pendiente' : 'Marcar como completada'}
          className={`task-checkbox-btn ${isDone ? 'is-checked' : ''}`}
        >
          {isDone ? <CheckIcon size={16} /> : null}
        </button>

        {/* Contenido Central */}
        <div className="task-content-block">
          <h3 className={`task-title ${isDone ? 'is-struck' : ''}`}>
            {task.title}
          </h3>

          {task.description && (
            <p className="task-desc">
              {task.description}
            </p>
          )}

          {/* Fila de Badges y Metadatos */}
          <div className="task-badges-row">
            <CategoryBadge category={task.category} />
            <PriorityBadge priority={task.priority} />

            {task.dueDate && (
              <span
                className={`badge task-due-badge ${overdue ? 'is-overdue' : ''} ${dueToday ? 'is-today' : ''}`}
              >
                <CalendarIcon size={12} />
                {formatDueDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>

        {/* Botones de Acción (Editar / Borrar) */}
        <div className="task-actions-col">
          <button
            type="button"
            className="icon-btn task-action-icon-btn"
            onClick={() => onEdit(task)}
            title="Editar tarea"
            aria-label="Editar"
          >
            <EditIcon size={14} />
          </button>
          <button
            type="button"
            className="icon-btn task-action-icon-btn delete-btn"
            onClick={() => onDelete(task.id)}
            title="Eliminar tarea"
            aria-label="Eliminar"
          >
            <TrashIcon size={14} />
          </button>
        </div>
      </div>

      {/* Sección de Subtareas con barra de progreso */}
      {totalSubs > 0 && (
        <div className="task-subtasks-container">
          <button
            type="button"
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="task-subtasks-toggle-btn"
          >
            <span>
              Subtareas: {completedSubs}/{totalSubs} ({subPercent}%)
            </span>
            <span className="task-subtasks-toggle-chevron">
              {showSubtasks ? 'Ocultar ▲' : 'Ver lista ▼'}
            </span>
          </button>

          {/* Barra de progreso */}
          <div className="task-subtasks-progress-track">
            <progress className="task-subtasks-progress-fill" value={subPercent} max={100} />
          </div>

          {/* Lista desplegable de subtareas */}
          {showSubtasks && (
            <div className="task-subtasks-list">
              {task.subtasks.map((st) => (
                <div
                  key={st.id}
                  onClick={() => onToggleSubTask(task.id, st.id)}
                  className="task-subtask-item"
                >
                  <span className={`task-subtask-icon ${st.completed ? 'is-completed' : ''}`}>
                    {st.completed ? <CheckIcon size={14} /> : <CircleIcon size={14} />}
                  </span>
                  <span className={`task-subtask-title ${st.completed ? 'is-completed' : ''}`}>
                    {st.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
