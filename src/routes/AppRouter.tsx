import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import { useNotes } from '../hooks/useNotes';
import { TasksPage } from '../pages/TasksPage';
import { NotesPage } from '../pages/NotesPage';
import { StatsPage } from '../pages/StatsPage';
import './routes.css';

interface AppRouterProps {
  taskHook: ReturnType<typeof useTasks>;
  noteHook: ReturnType<typeof useNotes>;
}

export const AppRouter: React.FC<AppRouterProps> = ({
  taskHook,
  noteHook,
}) => {
  return (
    <div className="app-router-content">
      <Routes>
        <Route path="/" element={<Navigate to="/tasks" replace />} />
        <Route path="/tasks" element={<TasksPage taskHook={taskHook} />} />
        <Route path="/notes" element={<NotesPage noteHook={noteHook} />} />
        <Route path="/stats" element={<StatsPage taskHook={taskHook} noteHook={noteHook} />} />
        <Route path="*" element={<Navigate to="/tasks" replace />} />
      </Routes>
    </div>
  );
};
