import React from 'react';
import { PriorityFilter, TaskFilter, TaskPriority } from '../../types';

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
    <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Pestañas de Estado */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '2px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {statusTabs.map((tab) => {
          const isActive = currentStatus === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectStatus(tab.id)}
              style={{
                flex: '0 0 auto',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: isActive ? 'var(--primary)' : 'var(--border-color)',
                backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '11px',
                  opacity: isActive ? 0.9 : 0.6,
                  padding: '1px 5px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-input)',
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selector de Prioridad Rápido */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
          Prioridad:
        </span>
        {priorities.map((p) => {
          const isSelected = currentPriority === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPriority(p.id)}
              style={{
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                border: isSelected ? '1px solid var(--border-focus)' : '1px solid transparent',
                backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {p.color && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: p.color }} />
              )}
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
