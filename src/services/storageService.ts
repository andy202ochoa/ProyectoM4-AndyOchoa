import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Note, Task } from '../types';
import { getTodayDateString } from '../utils/dateUtils';

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

const THEME_STORAGE_KEY = 'taskflow_theme_v1';

interface UserData {
  tasks: Task[];
  notes: Note[];
}

// Referencia al documento único del usuario en Firestore
const userDocRef = (uid: string) => doc(db, 'userData', uid);

/**
 * Lee el documento del usuario. Si no existe todavía (primer login),
 * lo crea con los datos semilla y los retorna.
 */
async function ensureUserDoc(uid: string): Promise<UserData> {
  const ref = userDocRef(uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const seed: UserData = { tasks: INITIAL_TASKS, notes: INITIAL_NOTES };
    await setDoc(ref, seed);
    return seed;
  }

  const data = snap.data();
  return {
    tasks: Array.isArray(data.tasks) ? (data.tasks as Task[]) : INITIAL_TASKS,
    notes: Array.isArray(data.notes) ? (data.notes as Note[]) : INITIAL_NOTES,
  };
}

export const StorageService = {
  /**
   * Obtiene las tareas del usuario desde Firestore (o crea el documento
   * con datos semilla si es su primer inicio de sesión)
   */
  async getTasks(uid: string): Promise<Task[]> {
    try {
      const data = await ensureUserDoc(uid);
      return data.tasks;
    } catch (e) {
      console.error('Error al leer tareas de Firestore:', e);
      return INITIAL_TASKS;
    }
  },

  /**
   * Guarda las tareas del usuario en Firestore
   */
  async saveTasks(uid: string, tasks: Task[]): Promise<void> {
    try {
      await setDoc(userDocRef(uid), { tasks }, { merge: true });
    } catch (e) {
      console.error('Error al guardar tareas en Firestore:', e);
    }
  },

  /**
   * Obtiene las notas del usuario desde Firestore (o crea el documento
   * con datos semilla si es su primer inicio de sesión)
   */
  async getNotes(uid: string): Promise<Note[]> {
    try {
      const data = await ensureUserDoc(uid);
      return data.notes;
    } catch (e) {
      console.error('Error al leer notas de Firestore:', e);
      return INITIAL_NOTES;
    }
  },

  /**
   * Guarda las notas del usuario en Firestore
   */
  async saveNotes(uid: string, notes: Note[]): Promise<void> {
    try {
      await setDoc(userDocRef(uid), { notes }, { merge: true });
    } catch (e) {
      console.error('Error al guardar notas en Firestore:', e);
    }
  },

  /**
   * Obtiene el tema actual ('dark' | 'light') — sigue siendo por dispositivo,
   * no tiene sentido guardarlo en la nube
   */
  getTheme(): 'dark' | 'light' {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'dark';
  },

  saveTheme(theme: 'dark' | 'light'): void {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  },

  /**
   * Exporta todos los datos del usuario como archivo JSON descargable
   */
  async exportData(uid: string): Promise<void> {
    const data = await ensureUserDoc(uid);
    const payload = {
      tasks: data.tasks,
      notes: data.notes,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
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
   * Importa datos desde una cadena JSON hacia el documento del usuario
   */
  async importData(uid: string, jsonString: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonString);
      const update: Partial<UserData> = {};

      if (Array.isArray(parsed.tasks)) update.tasks = parsed.tasks;
      if (Array.isArray(parsed.notes)) update.notes = parsed.notes;

      if (!update.tasks && !update.notes) return false;

      await setDoc(userDocRef(uid), update, { merge: true });
      return true;
    } catch (e) {
      console.error('Error importando datos a Firestore:', e);
      return false;
    }
  },

  /**
   * Restablece los datos del usuario a las tareas y notas de demostración
   */
  async resetToDefaults(uid: string): Promise<void> {
    await setDoc(userDocRef(uid), { tasks: INITIAL_TASKS, notes: INITIAL_NOTES }, { merge: true });
  },
};