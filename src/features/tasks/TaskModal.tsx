import React, { useState, useEffect } from 'react';
import { SubTask, Task, TaskCategory, TaskPriority } from '../../types';
import { Modal } from '../../components/common/Modal';
import { CATEGORY_CONFIG, getTodayDateString, PRIORITY_CONFIG } from '../../utils';
import { PlusIcon, TrashIcon } from '../../components/common/Icons';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: {
    title: string;
    description?: string;
    priority: TaskPriority;
    category: TaskCategory;
    dueDate?: string;
    subtasks?: { title: string; completed: boolean }[];
  }) => void;
  initialTask?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [category, setCategory] = useState<TaskCategory>('trabajo');
  const [dueDate, setDueDate] = useState('');
  const [subtasks, setSubtasks] = useState<{ id?: string; title: string; completed: boolean }[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setPriority(initialTask.priority);
      setCategory(initialTask.category);
      setDueDate(initialTask.dueDate || '');
      setSubtasks(initialTask.subtasks.map((st) => ({ ...st })));
    } else {
      setTitle('');
      setDescription('');
      setPriority('media');
      setCategory('trabajo');
      setDueDate(getTodayDateString());
      setSubtasks([]);
    }
    setNewSubtaskTitle('');
  }, [initialTask, isOpen]);

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks((prev) => [...prev, { title: newSubtaskTitle.trim(), completed: false }]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      category,
      dueDate: dueDate || undefined,
      subtasks,
    });

    onClose();
  };

  const categories = Object.keys(CATEGORY_CONFIG) as TaskCategory[];
  const priorities: TaskPriority[] = ['baja', 'media', 'alta'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTask ? 'Editar Tarea' : 'Nueva Tarea'}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!title.trim()}
            style={{ opacity: !title.trim() ? 0.6 : 1 }}
          >
            {initialTask ? 'Guardar Cambios' : 'Crear Tarea'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Título */}
        <div className="form-group">
          <label className="form-label" htmlFor="task-title">
            Título de la tarea *
          </label>
          <input
            id="task-title"
            type="text"
            className="form-input"
            placeholder="Ej: Preparar presentación del proyecto"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        {/* Descripción */}
        <div className="form-group">
          <label className="form-label" htmlFor="task-desc">
            Descripción o notas (opcional)
          </label>
          <textarea
            id="task-desc"
            className="form-textarea"
            placeholder="Añade detalles, links o contexto..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        {/* Fecha de Vencimiento */}
        <div className="form-group">
          <label className="form-label" htmlFor="task-date">
            Fecha de vencimiento
          </label>
          <input
            id="task-date"
            type="date"
            className="form-input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        {/* Prioridad */}
        <div className="form-group">
          <label className="form-label">Prioridad</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {priorities.map((p) => {
              const config = PRIORITY_CONFIG[p];
              const isSelected = priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: isSelected ? config.color : 'var(--border-color)',
                    backgroundColor: isSelected ? config.bg : 'var(--bg-input)',
                    color: isSelected ? config.color : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: config.color }} />
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categoría */}
        <div className="form-group">
          <label className="form-label">Categoría</label>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            {categories.map((cat) => {
              const conf = CATEGORY_CONFIG[cat];
              const isSelected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid',
                    borderColor: isSelected ? conf.color : 'var(--border-color)',
                    backgroundColor: isSelected ? `${conf.color}20` : 'var(--bg-input)',
                    color: isSelected ? conf.color : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span>{conf.icon}</span>
                  <span>{conf.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subtareas */}
        <div className="form-group">
          <label className="form-label">Subtareas / Pasos</label>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Añadir paso o subtarea..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddSubtask}
              style={{ flexShrink: 0, padding: '0 12px' }}
            >
              <PlusIcon size={16} />
            </button>
          </div>

          {subtasks.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {subtasks.map((st, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-input)',
                    fontSize: '13px',
                  }}
                >
                  <span>• {st.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};
