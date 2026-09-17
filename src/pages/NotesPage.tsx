import { useState } from 'react';
import { Note, NoteColor } from '../types';
import { useNotes } from '../hooks/useNotes';
import { NoteCard, NoteModal } from '../features/notes';
import { NotesIcon, PinIcon, PlusIcon, TagIcon } from '../components/common/Icons';
import { NOTE_COLOR_CONFIG } from '../utils';

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Banner de Notas */}
      <div
        style={{
          background: 'var(--accent-gradient)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 18px',
          color: '#ffffff',
          marginBottom: '14px',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', opacity: 0.9 }}>
            <NotesIcon size={14} />
            <span>Bloc de Notas Rápido</span>
          </div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginTop: '2px' }}>
            {totalNotesCount} nota{totalNotesCount === 1 ? '' : 's'} guardada{totalNotesCount === 1 ? '' : 's'}
          </h2>
          <p style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>
            {pinnedNotes.length} fijada{pinnedNotes.length === 1 ? '' : 's'} para acceso rápido
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            color: '#ffffff',
            padding: '8px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <PlusIcon size={14} />
          <span>Nota</span>
        </button>
      </div>

      {/* Filtro deslizante por Etiquetas */}
      {allTags.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '6px',
            scrollbarWidth: 'none',
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid',
              borderColor: selectedTag === null ? 'var(--primary)' : 'var(--border-color)',
              backgroundColor: selectedTag === null ? 'var(--primary)' : 'var(--bg-surface-elevated)',
              color: selectedTag === null ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
            }}
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
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--primary)' : 'var(--border-color)',
                  backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0,
                }}
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
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '14px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        <button
          type="button"
          onClick={() => setSelectedColor('todos')}
          style={{
            background: selectedColor === 'todos' ? 'var(--bg-input)' : 'transparent',
            border: selectedColor === 'todos' ? '1px solid var(--border-color)' : 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontWeight: 600,
            padding: '2px 6px',
            cursor: 'pointer',
          }}
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
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: conf.accent,
                border: isSelected ? '2px solid var(--text-primary)' : '1px solid transparent',
                cursor: 'pointer',
                transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.15s ease',
              }}
            />
          );
        })}
      </div>

      {/* Listado de Notas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Sección de Notas Fijadas */}
        {pinnedNotes.length > 0 && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '8px',
              }}
            >
              <PinIcon size={14} filled style={{ color: 'var(--primary)' }} />
              <span>Fijadas ({pinnedNotes.length})</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '10px',
              }}
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
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '8px',
                }}
              >
                Otras notas ({otherNotes.length})
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '10px',
              }}
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
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-color)',
              marginTop: '10px',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'rgba(236, 72, 153, 0.15)',
                color: '#ec4899',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <NotesIcon size={24} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {searchQuery || selectedTag || selectedColor !== 'todos'
                ? 'No hay notas con estos filtros'
                : 'Tu bloc de notas está vacío'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
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
