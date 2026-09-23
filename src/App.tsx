import { useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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
import { VerifyEmailPage } from './pages/VerifyEmailPage';

const tabToPath: Record<NavTab, string> = {
  tasks: '/tasks',
  notes: '/notes',
  stats: '/stats',
};

const pathToTab: Record<string, NavTab> = {
  '/tasks': 'tasks',
  '/notes': 'notes',
  '/stats': 'stats',
};

export default function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { theme, toggleTheme } = useTheme();
  const taskHook = useTasks();
  const noteHook = useNotes();

  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false);
  const [isQuickNoteModalOpen, setIsQuickNoteModalOpen] = useState(false);

  const currentTab: NavTab = pathToTab[location.pathname] ?? 'tasks';
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

  const handleSelectTab = (tab: NavTab) => {
    navigate(tabToPath[tab]);
  };

  // --- Gate de autenticación ---
  if (loading) {
    return <p>Cargando…</p>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={<LoginPage onSwitchToRegister={() => navigate('/register')} />}
        />
        <Route
          path="/register"
          element={<RegisterPage onSwitchToLogin={() => navigate('/login')} />}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Usuario autenticado pero sin verificar su correo (aplica solo a email/password;
  // los usuarios de Google llegan con emailVerified en true automáticamente)
  if (!user.emailVerified) {
    return <VerifyEmailPage user={user} />;
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
          <AppRouter taskHook={taskHook} noteHook={noteHook} />
        </main>

        <QuickAddFAB
          onNewTask={() => setIsQuickTaskModalOpen(true)}
          onNewNote={() => setIsQuickNoteModalOpen(true)}
        />

        <BottomNav
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          pendingTasksCount={taskHook.counts.activas}
          totalNotesCount={noteHook.totalNotesCount}
        />

        <TaskModal
          isOpen={isQuickTaskModalOpen}
          onClose={() => setIsQuickTaskModalOpen(false)}
          onSave={(data) => {
            taskHook.addTask(data);
            navigate('/tasks');
          }}
        />

        <NoteModal
          isOpen={isQuickNoteModalOpen}
          onClose={() => setIsQuickNoteModalOpen(false)}
          onSave={(data) => {
            noteHook.addNote(data);
            navigate('/notes');
          }}
        />
      </div>
    </div>
  );
}