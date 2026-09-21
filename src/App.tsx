import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { useTasks } from './hooks/useTasks';
import { useNotes } from './hooks/useNotes';
import { Header, BottomNav, NavTab, QuickAddFAB } from './components/common';
import { AppRouter } from './routes/AppRouter';
import { TaskModal } from './features/tasks';
import { NoteModal } from './features/notes';
import { LoginPage } from './pages/login';
import { RegisterPage } from './pages/register';

export default function App() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  const { theme, toggleTheme } = useTheme();
  const taskHook = useTasks();
  const noteHook = useNotes();
  const [currentTab, setCurrentTab] = useState<NavTab>('tasks');

  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false);
  const [isQuickNoteModalOpen, setIsQuickNoteModalOpen] = useState(false);

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

  // --- Gate de autenticación ---
  if (loading) {
    return <p>Cargando…</p>;
  }

  if (!user) {
    return authView === 'login' ? (
      <LoginPage onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
    );
  }
  // --- Fin gate ---

  return (
    <div className="app-shell">
      <div className="mobile-frame">
        <div className="mobile-notch-bar">
          <span>9:41</span>
          <span>TaskFlow Mobile</span>
          <span>100% 🔋</span>
        </div>

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

        <main className="main-content">
          <AppRouter
            currentTab={currentTab}
            taskHook={taskHook}
            noteHook={noteHook}
          />
        </main>

        <QuickAddFAB
          onNewTask={() => setIsQuickTaskModalOpen(true)}
          onNewNote={() => setIsQuickNoteModalOpen(true)}
        />

        <BottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          pendingTasksCount={taskHook.counts.activas}
          totalNotesCount={noteHook.totalNotesCount}
        />

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