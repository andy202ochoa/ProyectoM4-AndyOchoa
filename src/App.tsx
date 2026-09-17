import React, { useState } from 'react';
import { useTheme } from './hooks/useTheme';
import { useTasks } from './hooks/useTasks';
import { Header, BottomNav, NavTab } from './components/common';
import { TasksPage } from './pages/TasksPage';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const taskHook = useTasks();
  const [currentTab, setCurrentTab] = useState<NavTab>('tasks');

  return (
    <div className="app-shell">
      <div className="mobile-frame">
        {/* Barra ficticia estilo smartphone para Desktop */}
        <div className="mobile-notch-bar">
          <span>9:41</span>
          <span>TaskFlow Mobile</span>
          <span>100% 🔋</span>
        </div>

        {/* Encabezado */}
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          title="TaskFlow"
          subtitle="Tus tareas y notas organizadas"
          searchQuery={taskHook.searchQuery}
          onSearchChange={taskHook.setSearchQuery}
        />

        {/* Contenido Principal */}
        <main className="main-content">
          {currentTab === 'tasks' && <TasksPage taskHook={taskHook} />}
          {currentTab === 'notes' && (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
              <p>Módulo de Notas en preparación (Fase 5)</p>
            </div>
          )}
          {currentTab === 'stats' && (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
              <p>Módulo de Métricas en preparación (Fase 6)</p>
            </div>
          )}
        </main>

        {/* Barra de Navegación Inferior */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          pendingTasksCount={taskHook.counts.activas}
          totalNotesCount={4}
        />
      </div>
    </div>
  );
}
