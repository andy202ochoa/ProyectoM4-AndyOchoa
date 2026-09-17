import React from 'react';
import { Note } from '../../types';
import { NOTE_COLOR_CONFIG, formatRelativeTime } from '../../utils';
import { EditIcon, PinIcon, TrashIcon } from '../../components/common/Icons';
import { TagBadge } from '../../components/common/Badge';

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
  const colorConf = NOTE_COLOR_CONFIG[note.color] || NOTE_COLOR_CONFIG.grafito;

  return (
    <div
      style={{
        backgroundColor: colorConf.bgLight,
        borderColor: colorConf.borderLight,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.2s ease',
        position: 'relative',
        color: '#1e293b',
      }}
      className="note-card-dynamic"
      data-color={note.color}
    >
      {/* Cabecera de la Nota: Título y Botón Pin */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 700,
            lineHeight: 1.3,
            color: 'inherit',
            wordBreak: 'break-word',
          }}
        >
          {note.title}
        </h3>

        <button
          type="button"
          onClick={() => onTogglePin(note.id)}
          title={note.isPinned ? 'Desfijar nota' : 'Fijar nota'}
          aria-label="Fijar nota"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: note.isPinned ? colorConf.accent : 'var(--text-muted)',
            padding: '4px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease',
          }}
        >
          <PinIcon size={18} filled={note.isPinned} />
        </button>
      </div>

      {/* Contenido de la Nota */}
      <p
        style={{
          fontSize: '13.5px',
          lineHeight: 1.5,
          color: 'inherit',
          opacity: 0.9,
          whiteSpace: 'pre-line',
          wordBreak: 'break-word',
        }}
      >
        {note.content}
      </p>

      {/* Etiquetas / Tags */}
      {note.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '2px' }}>
          {note.tags.map((tag) => (
            <span
              key={tag}
              onClick={() => onSelectTag?.(tag)}
              style={{ cursor: onSelectTag ? 'pointer' : 'default' }}
            >
              <TagBadge label={tag} />
            </span>
          ))}
        </div>
      )}

      {/* Pie de Tarjeta: Timestamp y Acciones */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
          paddingTop: '8px',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          fontSize: '11px',
          opacity: 0.8,
        }}
      >
        <span>{formatRelativeTime(note.updatedAt)}</span>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            className="icon-btn"
            style={{
              width: '28px',
              height: '28px',
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              borderColor: 'rgba(0, 0, 0, 0.1)',
            }}
            onClick={() => onEdit(note)}
            title="Editar nota"
            aria-label="Editar"
          >
            <EditIcon size={14} />
          </button>
          <button
            type="button"
            className="icon-btn"
            style={{
              width: '28px',
              height: '28px',
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              borderColor: 'rgba(0, 0, 0, 0.1)',
              color: '#ef4444',
            }}
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
