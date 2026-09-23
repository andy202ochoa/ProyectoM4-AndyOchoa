import { Note, Task } from '../types';
import { getTodayDateString } from '../utils/dateUtils';

const TASKS_STORAGE_KEY = 'taskflow_tasks_v1';
const NOTES_STORAGE_KEY = 'taskflow_notes_v1';
const THEME_STORAGE_KEY = 'taskflow_theme_v1';

// Generar fechas de muestra relativas
const today = getTodayDateString();
const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const tomorrow = tomorrowDate.toISOString().split('T')[0];

const nextWeekDate = new Date();
nextWeekDate.setDate(nextWeekDate.getDate() + 4);
const nextWeek = nextWeekDate.toISOString().split('T')[0];

/**
 * Datos semilla iniciales para tareas
 */
export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Completar prototipo Mobile-First con Vite',
    description: 'Diseñar los componentes visuales con estilo glassmorphism y navegación inferior.',
    status: 'en_progreso',
    priority: 'alta',
    category: 'trabajo',
    dueDate: today,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: [
      { id: 'sub-1-1', title: 'Configurar tema dark/light mode', completed: true },
      { id: 'sub-1-2', title: 'Crear tarjetas con soporte táctil', completed: true },
      { id: 'sub-1-3', title: 'Probar formularios de edición rápida', completed: false },
    ],
  },
  {
    id: 'task-2',
    title: 'Revisión de arquitectura React 19',
    description: 'Validar optimizaciones de renderizado y hooks personalizados en TypeScript.',
    status: 'pendiente',
    priority: 'media',
    category: 'estudio',
    dueDate: tomorrow,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    subtasks: [
      { id: 'sub-2-1', title: 'Leer notas de la versión', completed: false },
      { id: 'sub-2-2', title: 'Probar compatibilidad de tipos', completed: false },
    ],
  },
  {
    id: 'task-3',
    title: 'Comprar frutas y café para la semana',
    description: 'Mercado orgánico: Manzanas, plátanos, avena y café grano tostado medio.',
    status: 'pendiente',
    priority: 'baja',
    category: 'compras',
    dueDate: nextWeek,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    subtasks: [
      { id: 'sub-3-1', title: 'Café de especialidad', completed: false },
      { id: 'sub-3-2', title: 'Frutos secos', completed: false },
      { id: 'sub-3-3', title: 'Leche de almendras', completed: false },
    ],
  },
  {
    id: 'task-4',
    title: 'Sesión de entrenamiento 45 min',
    description: 'Cardio ligero y rutina de fuerza en casa.',
    status: 'completada',
    priority: 'media',
    category: 'salud',
    dueDate: today,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    subtasks: [
      { id: 'sub-4-1', title: 'Calentamiento articular', completed: true },
      { id: 'sub-4-2', title: 'Circuito funcional', completed: true },
      { id: 'sub-4-3', title: 'Estiramientos', completed: true },
    ],
  },
];

/**
 * Datos semilla iniciales para notas
 */
export const INITIAL_NOTES: Note[] = [
  {
    id: 'note-1',
    title: '💡 Ideas para próximas funcionalidades',
    content: '- Recordatorios por notificación push\n- Sincronización en la nube con Supabase\n- Modo sin conexión (PWA Service Worker)\n- Atajos gestuales de deslizamiento',
    color: 'lavanda',
    isPinned: true,
    tags: ['Ideas', 'Roadmap', 'UX'],
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'note-2',
    title: '🎯 Principios de Diseño Mobile-First',
    content: '1. Los botones de acción deben estar cerca de la zona cómoda del pulgar.\n2. Los contrastes deben ser nítidos y legibles en cualquier condición de luz.\n3. Feedback instantáneo en cada toque con micro-animaciones.',
    color: 'menta',
    isPinned: true,
    tags: ['Diseño', 'Frontend'],
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'note-3',
    title: '📚 Libros recomendados de productividad',
    content: '• Atomic Habits - James Clear\n• Deep Work - Cal Newport\n• Make Time - Jake Knapp',
    color: 'coral',
    isPinned: false,
    tags: ['Lectura', 'Hábitos'],
    createdAt: new Date(Date.now() - 3600000 * 50).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 50).toISOString(),
  },
  {
    id: 'note-4',
    title: '🎧 Playlist para máxima concentración',
    content: 'Lofi hip hop beats, synthwave instrumental y sonido de lluvia suave a 60 bpm.',
    color: 'cielo',
    isPinned: false,
    tags: ['Enfoque', 'Música'],
    createdAt: new Date(Date.now() - 3600000 * 80).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 80).toISOString(),
  },
];

// Construye una clave de localStorage única por usuario
const scopedKey = (base: string, uid: string) => `${base}_${uid}`;

export const StorageService = {
  /**
   * Obtiene la lista de tareas del usuario (o seed data si es primera vez)
   */
  getTasks(uid: string): Task[] {
    try {
      const stored = localStorage.getItem(scopedKey(TASKS_STORAGE_KEY, uid));
      if (!stored) {
        this.saveTasks(uid, INITIAL_TASKS);
        return INITIAL_TASKS;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error al leer tareas de localStorage:', e);
      return INITIAL_TASKS;
    }
  },

  /**
   * Guarda la lista de tareas del usuario en localStorage
   */
  saveTasks(uid: string, tasks: Task[]): void {
    try {
      localStorage.setItem(scopedKey(TASKS_STORAGE_KEY, uid), JSON.stringify(tasks));
    } catch (e) {
      console.error('Error al guardar tareas:', e);
    }
  },

  /**
   * Obtiene la lista de notas del usuario (o seed data si es primera vez)
   */
  getNotes(uid: string): Note[] {
    try {
      const stored = localStorage.getItem(scopedKey(NOTES_STORAGE_KEY, uid));
      if (!stored) {
        this.saveNotes(uid, INITIAL_NOTES);
        return INITIAL_NOTES;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error al leer notas de localStorage:', e);
      return INITIAL_NOTES;
    }
  },

  /**
   * Guarda la lista de notas del usuario en localStorage
   */
  saveNotes(uid: string, notes: Note[]): void {
    try {
      localStorage.setItem(scopedKey(NOTES_STORAGE_KEY, uid), JSON.stringify(notes));
    } catch (e) {
      console.error('Error al guardar notas:', e);
    }
  },

  /**
   * Obtiene el tema actual ('dark' | 'light') — es por dispositivo, no por usuario
   */
  getTheme(): 'dark' | 'light' {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;

    // Si no está guardado, detectar preferencia del sistema
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'dark'; // Dark mode por defecto para wow factor
  },

  /**
   * Guarda la preferencia de tema
   */
  saveTheme(theme: 'dark' | 'light'): void {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  },

  /**
   * Exporta todos los datos del usuario como archivo JSON descargable
   */
  exportData(uid: string): void {
    const data = {
      tasks: this.getTasks(uid),
      notes: this.getNotes(uid),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taskflow_backup_${today}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Importa datos desde una cadena JSON hacia el espacio del usuario
   */
  importData(uid: string, jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.tasks)) {
        this.saveTasks(uid, parsed.tasks);
      }
      if (Array.isArray(parsed.notes)) {
        this.saveNotes(uid, parsed.notes);
      }
      return true;
    } catch (e) {
      console.error('Error importando datos:', e);
      return false;
    }
  },

  /**
   * Restablece los datos del usuario a las tareas y notas de demostración
   */
  resetToDefaults(uid: string): void {
    this.saveTasks(uid, INITIAL_TASKS);
    this.saveNotes(uid, INITIAL_NOTES);
  },
};