import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Note, NoteColor } from '../types';
import { StorageService } from '../services';
import { generateId } from '../utils';

export function useNotes(uid: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const notesRef = useRef<Note[]>([]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<NoteColor | 'todos'>('todos');

  // Mantener una referencia siempre actualizada para leer el estado
  // actual dentro de callbacks sin depender de closures viejas
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // Cargar las notas del usuario (filtradas por userId) al montar o si cambia el uid
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    StorageService.getNotes(uid).then((data) => {
      if (cancelled) return;
      setNotes(data);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [uid]);

  // Agregar una nota
  const addNote = useCallback((noteData: {
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
    StorageService.upsertNote(uid, newNote);
    return newNote;
  }, [uid]);

  // Actualizar una nota
  const updateNote = useCallback((id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
    const current = notesRef.current.find((n) => n.id === id);
    if (!current) return;

    const updatedNote: Note = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => prev.map((n) => (n.id === id ? updatedNote : n)));
    StorageService.upsertNote(uid, updatedNote);
  }, [uid]);

  // Eliminar una nota
  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    StorageService.removeNote(id);
  }, []);

  // Alternar fijado de nota (Pin / Unpin)
  const togglePinNote = useCallback((id: string) => {
    const current = notesRef.current.find((n) => n.id === id);
    if (!current) return;

    const updatedNote: Note = {
      ...current,
      isPinned: !current.isPinned,
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => prev.map((n) => (n.id === id ? updatedNote : n)));
    StorageService.upsertNote(uid, updatedNote);
  }, [uid]);

  // Extraer todas las etiquetas únicas existentes
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => tagsSet.add(t)));
    return Array.from(tagsSet);
  }, [notes]);

  // Notas filtradas por búsqueda, etiqueta y color
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

  // Dividir en notas fijadas y resto de notas ordenadas por fecha reciente
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