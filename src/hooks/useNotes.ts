import { useState, useEffect, useMemo, useCallback } from 'react';
import { Note, NoteColor } from '../types';
import { StorageService } from '../services';
import { generateId } from '../utils';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(() => StorageService.getNotes());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<NoteColor | 'todos'>('todos');

  // Sincronizar automáticamente en localStorage
  useEffect(() => {
    StorageService.saveNotes(notes);
  }, [notes]);

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
    return newNote;
  }, []);

  // Actualizar una nota
  const updateNote = useCallback((id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
            ...n,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
          : n
      )
    );
  }, []);

  // Eliminar una nota
  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Alternar fijado de nota (Pin / Unpin)
  const togglePinNote = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
            ...n,
            isPinned: !n.isPinned,
            updatedAt: new Date().toISOString(),
          }
          : n
      )
    );
  }, []);

  // Extraer todas las etiquetas únicas existentes
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => tagsSet.add(t)));
    return Array.from(tagsSet);
  }, [notes]);

  // Notas filtradas por búsqueda, etiqueta y color
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Filtro de color
      if (selectedColor !== 'todos' && note.color !== selectedColor) return false;

      // Filtro de etiqueta
      if (selectedTag && !note.tags.includes(selectedTag)) return false;

      // Filtro de búsqueda
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
