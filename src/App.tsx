import { useState } from 'react';
import { useTheme } from './hooks/useTheme';
import { useTasks } from './hooks/useTasks';
import { useNotes } from './hooks/useNotes';
import { Header, BottomNav, NavTab, QuickAddFAB } from './components/common';
import { AppRouter } from './routes/AppRouter';
import { TaskModal } from './features/tasks';
import { NoteModal } from './features/notes';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const taskHook = useTasks();
  const noteHook = useNotes();
  const [currentTab, setCurrentTab] = useState<NavTab>('tasks');

  // Modales globales para creación rápida vía FAB
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false);
  const [isQuickNoteModalOpen, setIsQuickNoteModalOpen] = useState(false);

  // Sincronización del buscador según la pestaña activa
  const isNotesTab = currentTab === 'notes';
  const isTasksTab = currentTab === 'tasks';
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
        {/* Barra de estado ficticia para entorno Desktop */}
        <div className="mobile-notch-bar">
          <span>9:41</span>
          <span>TaskFlow Mobile</span>
          <span>100% 🔋</span>
        </div>

        {/* Encabezado adaptable */}
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          title={isTasksTab ? 'TaskFlow' : isNotesTab ? 'Mis Notas' : 'Estadísticas'}
          subtitle={
            isTasksTab
              ? 'Tus tareas y actividades'
              : isNotesTab
                ? 'Ideas, apuntes y recordatorios'
                : 'Productividad y gestión'
          }
          searchQuery={currentSearchQuery}
          onSearchChange={handleSearchChange}
          showSearch={currentTab !== 'stats'}
        />

        {/* Vistas enrutadas */}
        <main className="main-content">
          <AppRouter
            currentTab={currentTab}
            taskHook={taskHook}
            noteHook={noteHook}
          />
        </main>

        {/* Botón de Acción Flotante (+ FAB) */}
        <QuickAddFAB
          onNewTask={() => setIsQuickTaskModalOpen(true)}
          onNewNote={() => setIsQuickNoteModalOpen(true)}
        />

        {/* Barra de Navegación Inferior */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          pendingTasksCount={taskHook.counts.activas}
          totalNotesCount={noteHook.totalNotesCount}
        />

        {/* Modales globales de creación rápida */}
        <TaskModal
          isOpen={isQuickTaskModalOpen}
          onClose={() => setIsQuickTaskModalOpen(false)}
          onSave={(data) => {
            taskHook.addTask(data);
            setCurrentTab('tasks');
          }}
        />

        <NoteModal
          isOpen={isQuickNoteModalOpen}
          onClose={() => setIsQuickNoteModalOpen(false)}
          onSave={(data) => {
            noteHook.addNote(data);
            setCurrentTab('notes');
          }}
        />
      </div>
    </div>
  );
}
