import { useState } from 'react';
import { Note, NoteColor } from '../types';
import { useNotes } from '../hooks/useNotes';
import { NoteCard, NoteModal } from '../features/notes';
import { NotesIcon, PinIcon, PlusIcon, TagIcon } from '../components/common/Icons';
import { NOTE_COLOR_CONFIG } from '../utils';
import './NotesPage.css';

interface NotesPageProps {
  noteHook: ReturnType<typeof useNotes>;
}

export const NotesPage: React.FC<NotesPageProps> = ({ noteHook }) => {
  const {
    pinnedNotes,
    otherNotes,
    allTags,
    searchQuery,
    selectedTag,
    setSelectedTag,
    selectedColor,
    setSelectedColor,
    addNote,
    updateNote,
    deleteNote,
    togglePinNote,
    totalNotesCount,
  } = noteHook;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const handleOpenCreate = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note: Note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleSave = (noteData: Parameters<typeof addNote>[0]) => {
    if (editingNote) {
      updateNote(editingNote.id, noteData);
    } else {
      addNote(noteData);
    }
  };

  const colors = Object.keys(NOTE_COLOR_CONFIG) as NoteColor[];
  const hasNotes = pinnedNotes.length > 0 || otherNotes.length > 0;

  return (
    <div className="notes-page">
      {/* Banner de Notas */}
      <div
        className="notes-page-banner"
      >
        <div>
          <div className="notes-banner-kicker">
            <NotesIcon size={14} />
            <span>Bloc de Notas Rápido</span>
          </div>
          <h2 className="notes-banner-title">
            {totalNotesCount} nota{totalNotesCount === 1 ? '' : 's'} guardada{totalNotesCount === 1 ? '' : 's'}
          </h2>
          <p className="notes-banner-subtitle">
            {pinnedNotes.length} fijada{pinnedNotes.length === 1 ? '' : 's'} para acceso rápido
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="notes-banner-action"
        >
          <PlusIcon size={14} />
          <span>Nota</span>
        </button>
      </div>

      {/* Filtro deslizante por Etiquetas */}
      {allTags.length > 0 && (
        <div
          className="notes-tag-filter"
        >
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className={`notes-filter-btn ${selectedTag === null ? 'is-selected' : ''}`}
          >
            Todas
          </button>
          {allTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={`notes-filter-btn ${isSelected ? 'is-selected' : ''}`}
              >
                <TagIcon size={12} />
                #{tag}
              </button>
            );
          })}
        </div>
      )}

      {/* Filtro por Paleta de Color */}
      <div
        className="notes-color-filter"
      >
        <button
          type="button"
          onClick={() => setSelectedColor('todos')}
          className={`notes-color-label ${selectedColor === 'todos' ? 'is-selected' : ''}`}
        >
          Colores:
        </button>
        {colors.map((c) => {
          const conf = NOTE_COLOR_CONFIG[c];
          const isSelected = selectedColor === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedColor(isSelected ? 'todos' : c)}
              title={conf.name}
              className={`notes-color-btn note-color-${c} ${isSelected ? 'is-selected' : ''}`}
            />
          );
        })}
      </div>

      {/* Listado de Notas */}
      <div className="notes-list">
        {/* Sección de Notas Fijadas */}
        {pinnedNotes.length > 0 && (
          <div>
            <div
              className="notes-section-title"
            >
              <PinIcon size={14} filled />
              <span>Fijadas ({pinnedNotes.length})</span>
            </div>

            <div
              className="notes-grid"
            >
              {pinnedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={handleOpenEdit}
                  onDelete={deleteNote}
                  onTogglePin={togglePinNote}
                  onSelectTag={setSelectedTag}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sección de Otras Notas */}
        {otherNotes.length > 0 && (
          <div>
            {pinnedNotes.length > 0 && (
              <div
                className="notes-section-title is-secondary"
              >
                Otras notas ({otherNotes.length})
              </div>
            )}

            <div
              className="notes-grid"
            >
              {otherNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={handleOpenEdit}
                  onDelete={deleteNote}
                  onTogglePin={togglePinNote}
                  onSelectTag={setSelectedTag}
                />
              ))}
            </div>
          </div>
        )}

        {/* Estado Vacío */}
        {!hasNotes && (
          <div
            className="notes-empty-state"
          >
            <div
              className="notes-empty-icon"
            >
              <NotesIcon size={24} />
            </div>
            <h3 className="notes-empty-title">
              {searchQuery || selectedTag || selectedColor !== 'todos'
                ? 'No hay notas con estos filtros'
                : 'Tu bloc de notas está vacío'}
            </h3>
            <p className="notes-empty-description">
              {searchQuery || selectedTag || selectedColor !== 'todos'
                ? 'Prueba limpiando los filtros o realizando otra búsqueda.'
                : 'Guarda pensamientos rápidos, enlaces, fragmentos de código o listas de ideas.'}
            </p>
            <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
              <PlusIcon size={16} />
              <span>Crear primera nota</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal para Crear/Editar Nota */}
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialNote={editingNote}
      />
    </div>
  );
};
