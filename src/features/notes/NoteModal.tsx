import { useState, useEffect } from 'react';
import { Note, NoteColor } from '../../types';
import { Modal } from '../../components/common/Modal';
import { NOTE_COLOR_CONFIG } from '../../utils';
import { CheckIcon, PinIcon, PlusIcon } from '../../components/common/Icons';
import { TagBadge } from '../../components/common/Badge';
import './NoteModal.css';

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
          >
            {initialNote ? 'Guardar Cambios' : 'Crear Nota'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="note-modal-form">
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
            className="form-textarea note-content-input"
            placeholder="Escribe tus notas, listas, apuntes o enlaces aquí..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* Paleta de Color */}
        <div className="form-group">
          <label className="form-label">Color de la nota</label>
          <div className="note-color-options">
            {colors.map((c) => {
              const conf = NOTE_COLOR_CONFIG[c];
              const isSelected = color === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  title={conf.name}
                  className={`note-color-btn note-color-${c} ${isSelected ? 'is-selected' : ''}`}
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
          className="note-pin-row"
        >
          <div className="note-pin-label">
            <PinIcon size={18} filled={isPinned} className={isPinned ? 'is-pinned' : ''} />
            <span>Fijar nota en la parte superior</span>
          </div>
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            className="note-pin-checkbox"
          />
        </div>

        {/* Etiquetas */}
        <div className="form-group">
          <label className="form-label">Etiquetas / Tags</label>
          <div className="note-tag-input-row">
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
              onClick={handleAddTag}
              className="btn btn-secondary note-add-tag-btn"
            >
              <PlusIcon size={16} />
            </button>
          </div>

          {tags.length > 0 && (
            <div className="note-tag-list">
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
