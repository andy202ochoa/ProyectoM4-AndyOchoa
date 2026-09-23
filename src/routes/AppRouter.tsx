import React from 'react';
import { NavTab } from '../components/common';
import { useTasks } from '../hooks/useTasks';
import { useNotes } from '../hooks/useNotes';
import { TasksPage } from '../pages/TasksPage';
import { NotesPage } from '../pages/NotesPage';
import { StatsPage } from '../pages/StatsPage';
import './routes.css';

interface AppRouterProps {
  currentTab: NavTab;
  taskHook: ReturnType<typeof useTasks>;
  noteHook: ReturnType<typeof useNotes>;
  uid: string;
}

export const AppRouter: React.FC<AppRouterProps> = ({
  currentTab,
  taskHook,
  noteHook,
  uid,
}) => {
  return (
    <div className="app-router-content">
      {currentTab === 'tasks' && <TasksPage taskHook={taskHook} />}
      {currentTab === 'notes' && <NotesPage noteHook={noteHook} />}
      {currentTab === 'stats' && <StatsPage taskHook={taskHook} noteHook={noteHook} uid={uid} />}
    </div>
  );
};