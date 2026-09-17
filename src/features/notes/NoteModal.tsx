import { useState, useEffect } from 'react';
import { Note, NoteColor } from '../../types';
import { Modal } from '../../components/common/Modal';
import { NOTE_COLOR_CONFIG } from '../../utils';
import { CheckIcon, PinIcon, PlusIcon } from '../../components/common/Icons';
import { TagBadge } from '../../components/common/Badge';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: {
    title: string;
    content: string;
    color: NoteColor;
    isPinned?: boolean;
    tags?: string[];
  }) => void;
  initialNote?: Note | null;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialNote,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<NoteColor>('lavanda');
  const [isPinned, setIsPinned] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  useEffect(() => {
    if (initialNote) {
      setTitle(initialNote.title);
      setContent(initialNote.content);
      setColor(initialNote.color);
      setIsPinned(initialNote.isPinned);
      setTags([...initialNote.tags]);
    } else {
      setTitle('');
      setContent('');
      setColor('lavanda');
      setIsPinned(false);
      setTags([]);
    }
    setNewTagInput('');
  }, [initialNote, isOpen]);

  const handleAddTag = () => {
    const clean = newTagInput.trim().replace(/^#/, '');
    if (!clean || tags.includes(clean)) return;
    setTags((prev) => [...prev, clean]);
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    onSave({
      title: title.trim() || 'Sin título',
      content: content.trim(),
      color,
      isPinned,
      tags,
    });

    onClose();
  };

  const colors = Object.keys(NOTE_COLOR_CONFIG) as NoteColor[];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialNote ? 'Editar Nota' : 'Nueva Nota'}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!title.trim() && !content.trim()}
            style={{ opacity: !title.trim() && !content.trim() ? 0.6 : 1 }}
          >
            {initialNote ? 'Guardar Cambios' : 'Crear Nota'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Título */}
        <div className="form-group">
          <label className="form-label" htmlFor="note-title">
            Título de la nota
          </label>
          <input
            id="note-title"
            type="text"
            className="form-input"
            placeholder="Ej: Ideas de diseño / Lista rápida"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        {/* Contenido */}
        <div className="form-group">
          <label className="form-label" htmlFor="note-content">
            Contenido
          </label>
          <textarea
            id="note-content"
            className="form-textarea"
            style={{ minHeight: '120px' }}
            placeholder="Escribe tus notas, listas, apuntes o enlaces aquí..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* Paleta de Color */}
        <div className="form-group">
          <label className="form-label">Color de la nota</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {colors.map((c) => {
              const conf = NOTE_COLOR_CONFIG[c];
              const isSelected = color === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  title={conf.name}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: conf.accent,
                    border: isSelected ? '3px solid var(--text-primary)' : '2px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: isSelected ? 'var(--shadow-md)' : 'none',
                    transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  {isSelected && <CheckIcon size={16} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fijar Nota */}
        <div
          onClick={() => setIsPinned(!isPinned)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 600 }}>
            <PinIcon size={18} filled={isPinned} style={{ color: isPinned ? 'var(--primary)' : 'var(--text-muted)' }} />
            <span>Fijar nota en la parte superior</span>
          </div>
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
          />
        </div>

        {/* Etiquetas */}
        <div className="form-group">
          <label className="form-label">Etiquetas / Tags</label>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Nueva etiqueta (ej: Proyecto, Ideas)..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddTag}
              style={{ flexShrink: 0, padding: '0 12px' }}
            >
              <PlusIcon size={16} />
            </button>
          </div>

          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {tags.map((tag) => (
                <TagBadge key={tag} label={tag} onRemove={() => handleRemoveTag(tag)} />
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};
