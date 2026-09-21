import React, { useState } from 'react';
import { Task } from '../types';
import { useTasks } from '../hooks/useTasks';
import { TaskFilterBar, TaskItem, TaskModal } from '../features/tasks';
import { CheckCircleIcon, PlusIcon, SparklesIcon } from '../components/common/Icons';
import './pages.css';

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
    <div className="tasks-page">
      {/* Banner de Productividad Diario */}
      <div
        className="tasks-page-banner"
      >
        <div>
          <div className="tasks-banner-kicker">
            <SparklesIcon size={14} />
            <span>Resumen Diario</span>
          </div>
          <h2 className="tasks-banner-title">
            {counts.activas === 0
              ? '¡Todo listo por hoy!'
              : `${counts.activas} tarea${counts.activas > 1 ? 's' : ''} pendiente${counts.activas > 1 ? 's' : ''}`}
          </h2>
          <p className="tasks-banner-subtitle">
            {counts.completadas} de {counts.total} completadas ({counts.total > 0 ? Math.round((counts.completadas / counts.total) * 100) : 0}%)
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="tasks-banner-action"
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
      <div className="tasks-list">
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
            className="tasks-empty-state"
          >
            <div
              className="tasks-empty-icon"
            >
              <CheckCircleIcon size={24} />
            </div>
            <h3 className="tasks-empty-title">
              {searchQuery
                ? 'No hay tareas que coincidan con la búsqueda'
                : statusFilter === 'completada'
                  ? 'Aún no has completado tareas en esta vista'
                  : 'No tienes tareas pendientes'}
            </h3>
            <p className="tasks-empty-description">
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
