import { useState } from 'react';
import { useTheme } from './hooks/useTheme';
import { useTasks } from './hooks/useTasks';
import { useNotes } from './hooks/useNotes';
import { Header, BottomNav, NavTab } from './components/common';
import { TasksPage } from './pages/TasksPage';
import { NotesPage } from './pages/NotesPage';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const taskHook = useTasks();
  const noteHook = useNotes();
  const [currentTab, setCurrentTab] = useState<NavTab>('tasks');

  // Conectar el buscador dinámicamente según la pestaña activa
  const isNotesTab = currentTab === 'notes';
  const currentSearchQuery = isNotesTab ? noteHook.searchQuery : taskHook.searchQuery;
  const handleSearchChange = (query: string) => {
    if (isNotesTab) {
      noteHook.setSearchQuery(query);
    } else {
      taskHook.setSearchQuery(query);
    }
  };

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
          title={isNotesTab ? 'Mis Notas' : currentTab === 'stats' ? 'Progreso' : 'TaskFlow'}
          subtitle={
            isNotesTab
              ? 'Ideas, apuntes y notas rápidas'
              : currentTab === 'stats'
              ? 'Métricas de productividad'
              : 'Tus tareas organizadas'
          }
          searchQuery={currentSearchQuery}
          onSearchChange={handleSearchChange}
          showSearch={currentTab !== 'stats'}
        />

        {/* Contenido Principal */}
        <main className="main-content">
          {currentTab === 'tasks' && <TasksPage taskHook={taskHook} />}
          {currentTab === 'notes' && <NotesPage noteHook={noteHook} />}
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
          totalNotesCount={noteHook.totalNotesCount}
        />
      </div>
    </div>
  );
}
