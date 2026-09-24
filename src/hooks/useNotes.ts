import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Note, NoteColor } from '../types';
import { generateId } from '../utils';
import { getNotes, createNote, updateNote as updateNoteService, deleteNote as deleteNoteService } from '../services/noteService';

export function useNotes(uid: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const notesRef = useRef<Note[]>([]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<NoteColor | 'todos'>('todos');

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // 🔥 CARGA INICIAL DESDE FIRESTORE
  useEffect(() => {
    let cancelled = false;

    const loadNotes = async () => {
      try {
        setLoading(true);
        setError(null);

        // Usamos la función getNotes de notesService.ts
        const data = await getNotes();

        if (!cancelled) {
          setNotes(data as Note[]);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError('No se pudieron cargar las notas');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadNotes();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  // 🔥 ADD CON ROLLBACK Y FIRESTORE
  const addNote = useCallback(async (noteData: {
    title: string;
    content: string;
    color: NoteColor;
    isPinned?: boolean;
    tags?: string[];
  }) => {
    const tempId = generateId();
    const newNotePayload = {
      title: noteData.title.trim(),
      content: noteData.content.trim(),
      color: noteData.color,
      isPinned: noteData.isPinned || false,
      tags: noteData.tags || [],
    };

    const tempNote: Note = {
      ...newNotePayload,
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Actualización optimista en la UI
    setNotes((prev) => [tempNote, ...prev]);

    try {
      // Guardamos en Firestore
      const createdNote = await createNote(newNotePayload);
      
      // Reemplazamos la nota temporal con la nota que incluye el ID generado por Firestore
      setNotes((prev) =>
      prev.map((n) => (n.id === tempId ? (createdNote as unknown as Note) : n))
      );

      return createdNote;
    } catch (err) {
      console.error(err);

      // Rollback en caso de error
      setNotes((prev) => prev.filter((n) => n.id !== tempId));
      setError('No se pudo guardar la nota');

      throw err;
    }
  }, []);

  // 🔥 UPDATE CON ROLLBACK
  const updateNote = useCallback(async (
    id: string,
    updates: Partial<Omit<Note, 'id' | 'createdAt'>>
  ) => {
    const current = notesRef.current.find((n) => n.id === id);
    if (!current) return;

    const updatedNote: Note = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const previous = current;

    setNotes((prev) => prev.map((n) => (n.id === id ? updatedNote : n)));

    try {
      await updateNoteService(id, updates);
    } catch (err) {
      console.error(err);

      // Rollback
      setNotes((prev) => prev.map((n) => (n.id === id ? previous : n)));
      setError('No se pudo actualizar la nota');
    }
  }, []);

  // 🔥 DELETE CON ROLLBACK
  const deleteNote = useCallback(async (id: string) => {
    const previous = notesRef.current;

    setNotes((prev) => prev.filter((n) => n.id !== id));

    try {
      await deleteNoteService(id);
    } catch (err) {
      console.error(err);

      // Rollback
      setNotes(previous);
      setError('No se pudo eliminar la nota');
    }
  }, []);

  // 🔥 TOGGLE PIN CON ROLLBACK
  const togglePinNote = useCallback(async (id: string) => {
    const current = notesRef.current.find((n) => n.id === id);
    if (!current) return;

    const newPinStatus = !current.isPinned;

    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isPinned: newPinStatus } : n))
    );

    try {
      await updateNoteService(id, { isPinned: newPinStatus });
    } catch (err) {
      console.error(err);

      // Rollback
      setNotes((prev) => prev.map((n) => (n.id === id ? current : n)));
      setError('No se pudo actualizar la nota');
    }
  }, []);

  // 🔹 TAGS
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    notes.forEach((n) => n.tags?.forEach((t) => tagsSet.add(t)));
    return Array.from(tagsSet);
  }, [notes]);

  // 🔹 FILTROS
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (selectedColor !== 'todos' && note.color !== selectedColor) return false;
      if (selectedTag && !note.tags?.includes(selectedTag)) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = note.title?.toLowerCase().includes(query);
        const matchContent = note.content?.toLowerCase().includes(query);
        const matchTag = note.tags?.some((t) => t.toLowerCase().includes(query));
        if (!matchTitle && !matchContent && !matchTag) return false;
      }

      return true;
    });
  }, [notes, selectedColor, selectedTag, searchQuery]);

  const pinnedNotes = useMemo(() => {
    return filteredNotes
      .filter((n) => n.isPinned)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [filteredNotes]);

  const otherNotes = useMemo(() => {
    return filteredNotes
      .filter((n) => !n.isPinned)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [filteredNotes]);

  return {
    notes,
    loading,
    error,
    filteredNotes,
    pinnedNotes,
    otherNotes,
    allTags,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    selectedColor,
    setSelectedColor,
    addNote,
    updateNote,
    deleteNote,
    togglePinNote,
    totalNotesCount: notes.length,
  };
}