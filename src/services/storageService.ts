import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Note, Task } from '../types';
import { getTodayDateString } from '../utils/dateUtils';

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

const TASKS_COLLECTION = 'tasks';
const NOTES_COLLECTION = 'notes';

export const StorageService = {
  /**
   * Obtiene SOLO las tareas cuyo campo userId coincide con el uid dado
   */
  async getTasks(uid: string): Promise<Task[]> {
    try {
      const q = query(collection(db, TASKS_COLLECTION), where('userId', '==', uid));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Primera vez del usuario: sembramos sus tareas de demostración
        const batch = writeBatch(db);
        INITIAL_TASKS.forEach((task) => {
          batch.set(doc(db, TASKS_COLLECTION, task.id), { ...task, userId: uid });
        });
        await batch.commit();
        return INITIAL_TASKS;
      }

      return snapshot.docs.map((d) => {
        const { userId, ...task } = d.data() as Task & { userId: string };
        return task as Task;
      });
    } catch (e) {
      console.error('Error al leer tareas de Firestore:', e);
      return [];
    }
  },

  /**
   * Crea o sobrescribe una tarea individual, con userId para el filtrado
   */
  async upsertTask(uid: string, task: Task): Promise<void> {
    try {
      await setDoc(doc(db, TASKS_COLLECTION, task.id), { ...task, userId: uid });
    } catch (e) {
      console.error('Error al guardar la tarea en Firestore:', e);
    }
  },

  /**
   * Actualiza campos puntuales de una tarea existente
   */
  async patchTask(taskId: string, updates: Partial<Task>): Promise<void> {
    try {
      await updateDoc(doc(db, TASKS_COLLECTION, taskId), updates);
    } catch (e) {
      console.error('Error al actualizar la tarea en Firestore:', e);
    }
  },

  /**
   * Elimina una tarea por su id
   */
  async removeTask(taskId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
    } catch (e) {
      console.error('Error al eliminar la tarea en Firestore:', e);
    }
  },

  /**
   * Obtiene SOLO las notas cuyo campo userId coincide con el uid dado
   */
  async getNotes(uid: string): Promise<Note[]> {
    try {
      const q = query(collection(db, NOTES_COLLECTION), where('userId', '==', uid));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        const batch = writeBatch(db);
        INITIAL_NOTES.forEach((note) => {
          batch.set(doc(db, NOTES_COLLECTION, note.id), { ...note, userId: uid });
        });
        await batch.commit();
        return INITIAL_NOTES;
      }

      return snapshot.docs.map((d) => {
        const { userId, ...note } = d.data() as Note & { userId: string };
        return note as Note;
      });
    } catch (e) {
      console.error('Error al leer notas de Firestore:', e);
      return [];
    }
  },

  /**
   * Crea o sobrescribe una nota individual, con userId para el filtrado
   */
  async upsertNote(uid: string, note: Note): Promise<void> {
    try {
      await setDoc(doc(db, NOTES_COLLECTION, note.id), { ...note, userId: uid });
    } catch (e) {
      console.error('Error al guardar la nota en Firestore:', e);
    }
  },

  /**
   * Actualiza campos puntuales de una nota existente
   */
  async patchNote(noteId: string, updates: Partial<Note>): Promise<void> {
    try {
      await updateDoc(doc(db, NOTES_COLLECTION, noteId), updates);
    } catch (e) {
      console.error('Error al actualizar la nota en Firestore:', e);
    }
  },

  /**
   * Elimina una nota por su id
   */
  async removeNote(noteId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, NOTES_COLLECTION, noteId));
    } catch (e) {
      console.error('Error al eliminar la nota en Firestore:', e);
    }
  },

  /**
   * Tema visual — sigue siendo por dispositivo, no por usuario
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
   * Exporta todas las tareas y notas del usuario (filtradas por userId) a un JSON descargable
   */
  async exportData(uid: string): Promise<void> {
    const [tasks, notes] = await Promise.all([this.getTasks(uid), this.getNotes(uid)]);
    const payload = {
      tasks,
      notes,
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
   * Importa un respaldo JSON, sobrescribiendo (o creando) las tareas/notas del usuario
   */
  async importData(uid: string, jsonString: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonString);
      const batch = writeBatch(db);
      let hasData = false;

      if (Array.isArray(parsed.tasks)) {
        parsed.tasks.forEach((task: Task) => {
          batch.set(doc(db, TASKS_COLLECTION, task.id), { ...task, userId: uid });
        });
        hasData = true;
      }

      if (Array.isArray(parsed.notes)) {
        parsed.notes.forEach((note: Note) => {
          batch.set(doc(db, NOTES_COLLECTION, note.id), { ...note, userId: uid });
        });
        hasData = true;
      }

      if (!hasData) return false;

      await batch.commit();
      return true;
    } catch (e) {
      console.error('Error importando datos a Firestore:', e);
      return false;
    }
  },

  /**
   * Borra las tareas/notas actuales del usuario y las reemplaza por los datos de demostración
   */
  async resetToDefaults(uid: string): Promise<void> {
    const [existingTasks, existingNotes] = await Promise.all([this.getTasks(uid), this.getNotes(uid)]);

    const batch = writeBatch(db);

    // Nota: getTasks/getNotes ya habrían sembrado datos si el usuario no tenía nada,
    // así que aquí simplemente forzamos que su colección quede igual a los datos semilla.
    existingTasks.forEach((t) => batch.delete(doc(db, TASKS_COLLECTION, t.id)));
    existingNotes.forEach((n) => batch.delete(doc(db, NOTES_COLLECTION, n.id)));

    INITIAL_TASKS.forEach((task) => {
      batch.set(doc(db, TASKS_COLLECTION, task.id), { ...task, userId: uid });
    });
    INITIAL_NOTES.forEach((note) => {
      batch.set(doc(db, NOTES_COLLECTION, note.id), { ...note, userId: uid });
    });

    await batch.commit();
  },
};