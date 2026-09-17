import React from 'react';
import { NotesIcon, StatsIcon, TasksIcon } from './Icons';

export type NavTab = 'tasks' | 'notes' | 'stats';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingTasksCount?: number;
  totalNotesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  pendingTasksCount = 0,
  totalNotesCount = 0,
}) => {
  return (
    <nav className="bottom-nav">
      <button
        type="button"
        className={`nav-item ${currentTab === 'tasks' ? 'active' : ''}`}
        onClick={() => onSelectTab('tasks')}
      >
        <div className="nav-icon-wrap">
          <TasksIcon size={20} />
          {pendingTasksCount > 0 && (
            <span className="nav-badge-pill">{pendingTasksCount > 99 ? '99+' : pendingTasksCount}</span>
          )}
        </div>
        <span>Tareas</span>
      </button>

      <button
        type="button"
        className={`nav-item ${currentTab === 'notes' ? 'active' : ''}`}
        onClick={() => onSelectTab('notes')}
      >
        <div className="nav-icon-wrap">
          <NotesIcon size={20} />
          {totalNotesCount > 0 && (
            <span
              className="nav-badge-pill"
              style={{ backgroundColor: 'var(--primary)', boxShadow: '0 0 6px var(--primary)' }}
            >
              {totalNotesCount}
            </span>
          )}
        </div>
        <span>Notas</span>
      </button>

      <button
        type="button"
        className={`nav-item ${currentTab === 'stats' ? 'active' : ''}`}
        onClick={() => onSelectTab('stats')}
      >
        <div className="nav-icon-wrap">
          <StatsIcon size={20} />
        </div>
        <span>Progreso</span>
      </button>
    </nav>
  );
};
