import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { db, auth } from "./firebase";

// Tipo auxiliar para TypeScript
export interface NoteData {
  title: string;
  content: string;
  [key: string]: any;
}

// 1. Obtener usuario de forma asíncrona
const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      unsubscribe();
      resolve(currentUser);
    });
  });
};

// 2. Leer notas
export const getNotes = async () => {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const q = query(collection(db, "notes"), where("userId", "==", user.uid));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// 3. Crear nota
export const createNote = async (noteData: NoteData) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const docRef = await addDoc(collection(db, "notes"), {
    ...noteData,
    userId: user.uid, // ⚠️ Requisito obligatorio para tus reglas de Firestore
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id, ...noteData, userId: user.uid };
};

// 4. Actualizar nota
export const updateNote = async (noteId: string, noteData: Partial<NoteData>) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const noteRef = doc(db, "notes", noteId);
  await updateDoc(noteRef, {
    ...noteData,
    updatedAt: serverTimestamp(),
  });
};

// 5. Eliminar nota
export const deleteNote = async (noteId: string) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const noteRef = doc(db, "notes", noteId);
  await deleteDoc(noteRef);
};