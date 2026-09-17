import { useState, useRef, useEffect } from 'react';
import { NotesIcon, PlusIcon, TasksIcon } from './Icons';
import './QuickAddFAB.css';

interface QuickAddFABProps {
  onNewTask: () => void;
  onNewNote: () => void;
}

export const QuickAddFAB: React.FC<QuickAddFABProps> = ({ onNewTask, onNewNote }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar si se toca fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="fab-container" ref={menuRef}>
      {isOpen && (
        <div className="fab-menu">
          <button
            type="button"
            className="fab-option"
            onClick={() => {
              setIsOpen(false);
              onNewNote();
            }}
          >
            <span>Nueva Nota</span>
            <div className="fab-icon-bubble notes">
              <NotesIcon size={16} />
            </div>
          </button>

          <button
            type="button"
            className="fab-option"
            onClick={() => {
              setIsOpen(false);
              onNewTask();
            }}
          >
            <span>Nueva Tarea</span>
            <div className="fab-icon-bubble tasks">
              <TasksIcon size={16} />
            </div>
          </button>
        </div>
      )}

      <button
        type="button"
        className={`fab-main ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Creación rápida"
        aria-label="Añadir nueva tarea o nota"
      >
        <PlusIcon size={24} />
      </button>
    </div>
  );
};
