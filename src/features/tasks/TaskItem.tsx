import React, { useState } from 'react';
import { Task } from '../../types';
import { formatDueDate, isDueToday, isOverdue } from '../../utils';
import { CalendarIcon, CheckIcon, CircleIcon, EditIcon, TrashIcon } from '../../components/common/Icons';
import { CategoryBadge, PriorityBadge } from '../../components/common/Badge';

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
    <div
      style={{
        backgroundColor: isDone ? 'var(--bg-app)' : 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 16px',
        marginBottom: '10px',
        boxShadow: isDone ? 'none' : 'var(--shadow-sm)',
        opacity: isDone ? 0.75 : 1,
        transition: 'all 0.25s ease',
        position: 'relative',
      }}
    >
      {/* Fila Principal: Checkbox + Título + Acciones */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Botón Checkbox Interactivo */}
        <button
          type="button"
          onClick={() => onToggleStatus(task.id)}
          aria-label={isDone ? 'Marcar como pendiente' : 'Marcar como completada'}
          style={{
            background: isDone ? '#10b981' : 'transparent',
            border: isDone ? 'none' : '2px solid var(--text-muted)',
            borderRadius: '50%',
            width: '26px',
            height: '26px',
            minWidth: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginTop: '2px',
            color: '#ffffff',
            transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: isDone ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none',
          }}
        >
          {isDone ? <CheckIcon size={16} /> : null}
        </button>

        {/* Contenido Central */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
              textDecoration: isDone ? 'line-through' : 'none',
              marginBottom: '4px',
              wordBreak: 'break-word',
              lineHeight: 1.35,
            }}
          >
            {task.title}
          </h3>

          {task.description && (
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                marginBottom: '8px',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {task.description}
            </p>
          )}

          {/* Fila de Badges y Metadatos */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '6px',
              marginTop: '6px',
            }}
          >
            <CategoryBadge category={task.category} />
            <PriorityBadge priority={task.priority} />

            {task.dueDate && (
              <span
                className="badge"
                style={{
                  backgroundColor: overdue
                    ? 'rgba(239, 68, 68, 0.12)'
                    : dueToday
                    ? 'rgba(245, 158, 11, 0.12)'
                    : 'var(--bg-input)',
                  color: overdue ? '#ef4444' : dueToday ? '#f59e0b' : 'var(--text-secondary)',
                  border: overdue
                    ? '1px solid rgba(239, 68, 68, 0.3)'
                    : dueToday
                    ? '1px solid rgba(245, 158, 11, 0.3)'
                    : '1px solid var(--border-color)',
                }}
              >
                <CalendarIcon size={12} />
                {formatDueDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>

        {/* Botones de Acción (Editar / Borrar) */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            type="button"
            className="icon-btn"
            style={{ width: '30px', height: '30px', padding: 0 }}
            onClick={() => onEdit(task)}
            title="Editar tarea"
            aria-label="Editar"
          >
            <EditIcon size={14} />
          </button>
          <button
            type="button"
            className="icon-btn"
            style={{ width: '30px', height: '30px', padding: 0, color: '#ef4444' }}
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
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setShowSubtasks(!showSubtasks)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <span>
              Subtareas: {completedSubs}/{totalSubs} ({subPercent}%)
            </span>
            <span style={{ fontSize: '11px', color: 'var(--primary)' }}>
              {showSubtasks ? 'Ocultar ▲' : 'Ver lista ▼'}
            </span>
          </button>

          {/* Barra de progreso */}
          <div
            style={{
              height: '4px',
              width: '100%',
              backgroundColor: 'var(--bg-input)',
              borderRadius: '2px',
              marginTop: '6px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${subPercent}%`,
                backgroundColor: subPercent === 100 ? '#10b981' : 'var(--primary)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {/* Lista desplegable de subtareas */}
          {showSubtasks && (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {task.subtasks.map((st) => (
                <div
                  key={st.id}
                  onClick={() => onToggleSubTask(task.id, st.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-input)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <span style={{ color: st.completed ? '#10b981' : 'var(--text-muted)', display: 'flex' }}>
                    {st.completed ? <CheckIcon size={14} /> : <CircleIcon size={14} />}
                  </span>
                  <span
                    style={{
                      fontSize: '13px',
                      color: st.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: st.completed ? 'line-through' : 'none',
                    }}
                  >
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
