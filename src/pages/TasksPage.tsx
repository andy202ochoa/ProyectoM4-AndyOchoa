import React, { useState } from 'react';
import { Task } from '../types';
import { useTasks } from '../hooks/useTasks';
import { TaskFilterBar, TaskItem, TaskModal } from '../features/tasks';
import { CheckCircleIcon, PlusIcon, SparklesIcon } from '../components/common/Icons';

interface TasksPageProps {
  taskHook: ReturnType<typeof useTasks>;
  onOpenNewTaskModal?: () => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({ taskHook }) => {
  const {
    filteredTasks,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    counts,
    toggleTaskStatus,
    toggleSubTask,
    deleteTask,
    addTask,
    updateTask,
    searchQuery,
  } = taskHook;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSave = (taskData: Parameters<typeof addTask>[0]) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Banner de Productividad Diario */}
      <div
        style={{
          background: 'var(--primary-gradient)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 18px',
          color: '#ffffff',
          marginBottom: '16px',
          boxShadow: 'var(--shadow-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', opacity: 0.9 }}>
            <SparklesIcon size={14} />
            <span>Resumen Diario</span>
          </div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginTop: '2px' }}>
            {counts.activas === 0
              ? '¡Todo listo por hoy!'
              : `${counts.activas} tarea${counts.activas > 1 ? 's' : ''} pendiente${counts.activas > 1 ? 's' : ''}`}
          </h2>
          <p style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>
            {counts.completadas} de {counts.total} completadas ({counts.total > 0 ? Math.round((counts.completadas / counts.total) * 100) : 0}%)
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
          <span>Añadir</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <TaskFilterBar
        currentStatus={statusFilter}
        onSelectStatus={setStatusFilter}
        currentPriority={priorityFilter}
        onSelectPriority={setPriorityFilter}
        counts={counts}
      />

      {/* Lista de Tareas */}
      <div style={{ flex: 1 }}>
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleStatus={toggleTaskStatus}
              onToggleSubTask={toggleSubTask}
              onEdit={handleOpenEdit}
              onDelete={deleteTask}
            />
          ))
        ) : (
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
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <CheckCircleIcon size={24} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {searchQuery
                ? 'No hay tareas que coincidan con la búsqueda'
                : statusFilter === 'completada'
                ? 'Aún no has completado tareas en esta vista'
                : 'No tienes tareas pendientes'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {searchQuery
                ? 'Intenta con otro término o limpia el buscador.'
                : 'Crea una nueva tarea para mantener tu día productivo y organizado.'}
            </p>
            <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
              <PlusIcon size={16} />
              <span>Crear nueva tarea</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal para crear o editar */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialTask={editingTask}
      />
    </div>
  );
};
