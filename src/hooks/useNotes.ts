import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Note, NoteColor } from '../types';
import { StorageService } from '../services';
import { generateId } from '../utils';

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

  // 🔥 CARGA INICIAL CON MANEJO DE ERRORES
  useEffect(() => {
    let cancelled = false;

    const loadNotes = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await StorageService.getNotes(uid);

        if (!cancelled) {
          setNotes(data);
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

  // 🔥 ADD CON ROLLBACK
  const addNote = useCallback(async (noteData: {
    title: string;
    content: string;
    color: NoteColor;
    isPinned?: boolean;
    tags?: string[];
  }) => {
    const newNote: Note = {
      id: generateId(),
      title: noteData.title.trim(),
      content: noteData.content.trim(),
      color: noteData.color,
      isPinned: noteData.isPinned || false,
      tags: noteData.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => [newNote, ...prev]);

    try {
      await StorageService.upsertNote(uid, newNote);
      return newNote;
    } catch (err) {
      console.error(err);

      // rollback
      setNotes((prev) => prev.filter((n) => n.id !== newNote.id));
      setError('No se pudo guardar la nota');

      throw err;
    }
  }, [uid]);

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
      await StorageService.upsertNote(uid, updatedNote);
    } catch (err) {
      console.error(err);

      // rollback
      setNotes((prev) => prev.map((n) => (n.id === id ? previous : n)));
      setError('No se pudo actualizar la nota');
    }
  }, [uid]);

  // 🔥 DELETE CON ROLLBACK
  const deleteNote = useCallback(async (id: string) => {
    const previous = notesRef.current;

    setNotes((prev) => prev.filter((n) => n.id !== id));

    try {
      await StorageService.removeNote(id);
    } catch (err) {
      console.error(err);

      // rollback
      setNotes(previous);
      setError('No se pudo eliminar la nota');
    }
  }, []);

  // 🔥 TOGGLE PIN CON ROLLBACK
  const togglePinNote = useCallback(async (id: string) => {
    const current = notesRef.current.find((n) => n.id === id);
    if (!current) return;

    const updatedNote: Note = {
      ...current,
      isPinned: !current.isPinned,
      updatedAt: new Date().toISOString(),
    };

    const previous = current;

    setNotes((prev) => prev.map((n) => (n.id === id ? updatedNote : n)));

    try {
      await StorageService.upsertNote(uid, updatedNote);
    } catch (err) {
      console.error(err);

      // rollback
      setNotes((prev) => prev.map((n) => (n.id === id ? previous : n)));
      setError('No se pudo actualizar la nota');
    }
  }, [uid]);

  // 🔹 TAGS
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => tagsSet.add(t)));
    return Array.from(tagsSet);
  }, [notes]);

  // 🔹 FILTROS
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (selectedColor !== 'todos' && note.color !== selectedColor) return false;
      if (selectedTag && !note.tags.includes(selectedTag)) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = note.title.toLowerCase().includes(query);
        const matchContent = note.content.toLowerCase().includes(query);
        const matchTag = note.tags.some((t) => t.toLowerCase().includes(query));
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