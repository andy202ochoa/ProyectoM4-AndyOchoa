import React from 'react';
import { PriorityFilter, TaskFilter } from '../../types';
import './tasks.css';

interface TaskFilterBarProps {
  currentStatus: TaskFilter;
  onSelectStatus: (status: TaskFilter) => void;
  currentPriority: PriorityFilter;
  onSelectPriority: (priority: PriorityFilter) => void;
  counts: {
    total: number;
    pendientes: number;
    en_progreso: number;
    completadas: number;
  };
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  currentStatus,
  onSelectStatus,
  currentPriority,
  onSelectPriority,
  counts,
}) => {
  const statusTabs: { id: TaskFilter; label: string; count: number }[] = [
    { id: 'todas', label: 'Todas', count: counts.total },
    { id: 'pendiente', label: 'Pendientes', count: counts.pendientes },
    { id: 'en_progreso', label: 'En curso', count: counts.en_progreso },
    { id: 'completada', label: 'Hechas', count: counts.completadas },
  ];

  const priorities: { id: PriorityFilter; label: string; color?: string }[] = [
    { id: 'todas', label: 'Todas' },
    { id: 'alta', label: 'Alta', color: '#ef4444' },
    { id: 'media', label: 'Media', color: '#f59e0b' },
    { id: 'baja', label: 'Baja', color: '#10b981' },
  ];

  return (
    <div className="task-filter-container">
      {/* Pestañas de Estado */}
      <div className="task-filter-status-row">
        {statusTabs.map((tab) => {
          const isActive = currentStatus === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectStatus(tab.id)}
              className={`task-filter-status-pill ${isActive ? 'is-active' : ''}`}
            >
              <span>{tab.label}</span>
              <span className="task-filter-count-badge">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selector de Prioridad Rápido */}
      <div className="task-filter-priority-row">
        <span className="task-filter-priority-label">
          Prioridad:
        </span>
        {priorities.map((p) => {
          const isSelected = currentPriority === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPriority(p.id)}
              className={`task-filter-priority-btn ${isSelected ? 'is-selected' : ''}`}
            >
              {p.color && (
                <span className={`task-filter-priority-dot priority-${p.id}`} />
              )}
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
