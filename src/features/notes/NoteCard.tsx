import React from 'react';
import { Note } from '../../types';
import { formatRelativeTime } from '../../utils';
import { EditIcon, PinIcon, TrashIcon } from '../../components/common/Icons';
import { TagBadge } from '../../components/common/Badge';
import './NoteCard.css';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onSelectTag?: (tag: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onSelectTag,
}) => {
  return (
    <div
      className="note-card-dynamic"
      data-color={note.color}
    >
      {/* Cabecera de la Nota: Título y Botón Pin */}
      <div className="note-card-header">
        <h3 className="note-card-title">
          {note.title}
        </h3>

        <button
          type="button"
          onClick={() => onTogglePin(note.id)}
          title={note.isPinned ? 'Desfijar nota' : 'Fijar nota'}
          aria-label="Fijar nota"
          className={`note-pin-btn ${note.isPinned ? 'is-pinned' : ''}`}
        >
          <PinIcon size={18} filled={note.isPinned} />
        </button>
      </div>

      {/* Contenido de la Nota */}
      <p
        className="note-card-content"
      >
        {note.content}
      </p>

      {/* Etiquetas / Tags */}
      {note.tags.length > 0 && (
        <div className="note-card-tags">
          {note.tags.map((tag) => (
            <span
              key={tag}
              onClick={() => onSelectTag?.(tag)}
              className={onSelectTag ? 'is-clickable' : ''}
            >
              <TagBadge label={tag} />
            </span>
          ))}
        </div>
      )}

      {/* Pie de Tarjeta: Timestamp y Acciones */}
      <div
        className="note-card-footer"
      >
        <span>{formatRelativeTime(note.updatedAt)}</span>

        <div className="note-card-actions">
          <button
            type="button"
            className="icon-btn note-action-btn"
            onClick={() => onEdit(note)}
            title="Editar nota"
            aria-label="Editar"
          >
            <EditIcon size={14} />
          </button>
          <button
            type="button"
            className="icon-btn note-action-btn delete-btn"
            onClick={() => onDelete(note.id)}
            title="Eliminar nota"
            aria-label="Eliminar"
          >
            <TrashIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
