import { useRef, useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useNotes } from '../hooks/useNotes';
import { StorageService } from '../services';
import { CATEGORY_CONFIG, PRIORITY_CONFIG, isOverdue } from '../utils';
import { ExportIcon, ResetIcon, SparklesIcon, TagIcon } from '../components/common/Icons';
import { TaskCategory, TaskPriority } from '../types';

interface StatsPageProps {
  taskHook: ReturnType<typeof useTasks>;
  noteHook: ReturnType<typeof useNotes>;
  onRefreshData?: () => void;
}

export const StatsPage: React.FC<StatsPageProps> = ({ taskHook, noteHook }) => {
  const { tasks } = taskHook;
  const { notes } = noteHook;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Cálculos de métricas
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completada').length;
  const pendingTasks = tasks.filter((t) => t.status === 'pendiente').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'en_progreso').length;
  const overdueTasks = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;

  const totalSubtasks = tasks.reduce((acc, t) => acc + t.subtasks.length, 0);
  const completedSubtasks = tasks.reduce(
    (acc, t) => acc + t.subtasks.filter((s) => s.completed).length,
    0
  );

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Desglose por categoría
  const categoryCounts = tasks.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {} as Record<TaskCategory, number>);

  const categories = Object.keys(CATEGORY_CONFIG) as TaskCategory[];

  // Desglose por prioridad
  const priorityCounts = tasks.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {} as Record<TaskPriority, number>);

  const priorities: TaskPriority[] = ['alta', 'media', 'baja'];

  // Manejo de exportación
  const handleExport = () => {
    StorageService.exportData();
    showNotification('¡Copia de seguridad descargada con éxito!');
  };

  // Manejo de importación
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = StorageService.importData(content);
        if (success) {
          showNotification('¡Datos importados correctamente! Recargando vista...');
          setTimeout(() => window.location.reload(), 800);
        } else {
          showNotification('El archivo no contiene un formato de respaldo válido.');
        }
      } catch {
        showNotification('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Restablecer valores demo
  const handleResetDefaults = () => {
    const confirmed = window.confirm(
      '¿Deseas restablecer las tareas y notas de demostración? Esto reemplazará tus cambios actuales.'
    );
    if (confirmed) {
      StorageService.resetToDefaults();
      showNotification('¡Datos de demostración restablecidos! Recargando...');
      setTimeout(() => window.location.reload(), 600);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '10px' }}>
      {/* Toast Notificación */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '74px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 90,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {notification}
        </div>
      )}

      {/* Tarjeta de Tasa de Productividad */}
      <div
        style={{
          background: 'var(--primary-gradient)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          color: '#ffffff',
          boxShadow: 'var(--shadow-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', opacity: 0.9 }}>
            <SparklesIcon size={14} />
            <span>Índice de Productividad</span>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px' }}>
            {completionRate}%
          </h2>
          <p style={{ fontSize: '12.5px', opacity: 0.9, marginTop: '2px', maxWidth: '190px', lineHeight: 1.3 }}>
            {completionRate === 100
              ? '¡Excelente! Has completado todas tus tareas.'
              : completionRate >= 50
              ? '¡Gran avance! Vas por más de la mitad del camino.'
              : 'Buen comienzo, ¡sigue tachando pendientes!'}
          </p>
        </div>

        {/* Gráfico circular estilizado */}
        <div style={{ position: 'relative', width: '82px', height: '82px' }}>
          <svg width="82" height="82" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="3.8"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3.8"
              strokeDasharray={`${completionRate}, 100`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 800,
            }}
          >
            {completedTasks}/{totalTasks}
          </div>
        </div>
      </div>

      {/* Resumen en 4 Tarjetas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        <div
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>PENDIENTES</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
            {pendingTasks}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Por iniciar
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
          }}
        >
          <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>EN PROGRESO</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
            {inProgressTasks}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            En desarrollo
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
          }}
        >
          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>COMPLETADAS</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
            {completedTasks}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Metas logradas
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid',
            borderColor: overdueTasks > 0 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
          }}
        >
          <div style={{ fontSize: '11px', color: overdueTasks > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
            VENCIDAS
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: overdueTasks > 0 ? '#ef4444' : 'var(--text-primary)',
              marginTop: '2px',
            }}
          >
            {overdueTasks}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {overdueTasks > 0 ? 'Requieren atención' : '¡Todo al día!'}
          </div>
        </div>
      </div>

      {/* Métricas de Subtareas y Notas */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Desglose General
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Progreso de Subtareas</span>
              <span style={{ fontWeight: 600 }}>
                {completedSubtasks} de {totalSubtasks}
              </span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0}%`,
                  backgroundColor: '#6366f1',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '6px' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TagIcon size={14} /> Total de Notas en Bloc
            </span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {notes.length} ({notes.filter((n) => n.isPinned).length} fijadas)
            </span>
          </div>
        </div>
      </div>

      {/* Distribución por Categorías */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Tareas por Categoría
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {categories.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
            const conf = CATEGORY_CONFIG[cat];
            return (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '14px', width: '22px' }}>{conf.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{conf.label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '5px', backgroundColor: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: conf.color,
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Distribución por Prioridad */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Tareas por Prioridad
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {priorities.map((p) => {
            const count = priorityCounts[p] || 0;
            const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
            const conf = PRIORITY_CONFIG[p];
            return (
              <div key={p}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 600, color: conf.color }}>{conf.label}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      backgroundColor: conf.color,
                      borderRadius: '3px',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gestión de Datos y Respaldos */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Gestión de Datos
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Exporta tu información a un archivo JSON o importa una copia existente.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button type="button" className="btn btn-secondary" onClick={handleExport} style={{ width: '100%' }}>
            <ExportIcon size={16} />
            <span>Exportar Copia de Seguridad</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            style={{ width: '100%' }}
          >
            <span>Importar Copia (JSON)</span>
          </button>

          <button
            type="button"
            className="btn btn-danger"
            onClick={handleResetDefaults}
            style={{ width: '100%', marginTop: '4px' }}
          >
            <ResetIcon size={16} />
            <span>Restablecer Datos de Demostración</span>
          </button>
        </div>
      </div>
    </div>
  );
};
