import { useRef, useState } from 'react';
import { signOut } from 'firebase/auth';
import { useTasks } from '../hooks/useTasks';
import { useNotes } from '../hooks/useNotes';
import { StorageService } from '../services';
import { auth } from '../services/firebase';
import { CATEGORY_CONFIG, PRIORITY_CONFIG, isOverdue } from '../utils';
import { ExportIcon, ResetIcon, SparklesIcon, TagIcon } from '../components/common/Icons';
import { TaskCategory, TaskPriority } from '../types';
import './pages.css';

interface StatsPageProps {
  taskHook: ReturnType<typeof useTasks>;
  noteHook: ReturnType<typeof useNotes>;
  uid: string;
}

export const StatsPage: React.FC<StatsPageProps> = ({ taskHook, noteHook, uid }) => {
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
  const overdueTasksList = tasks.filter((t) => isOverdue(t.dueDate, t.status));
  const overdueTasks = overdueTasksList.length;

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
  const handleExport = async () => {
    try {
      await StorageService.exportData(uid);
      showNotification('¡Copia de seguridad descargada con éxito!');
    } catch {
      showNotification('No se pudo generar la copia de seguridad.');
    }
  };

  // Manejo de importación
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const success = await StorageService.importData(uid, content);
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
  const handleResetDefaults = async () => {
    const confirmed = window.confirm(
      '¿Deseas restablecer las tareas y notas de demostración? Esto reemplazará tus cambios actuales.'
    );
    if (confirmed) {
      try {
        await StorageService.resetToDefaults(uid);
        showNotification('¡Datos de demostración restablecidos! Recargando...');
        setTimeout(() => window.location.reload(), 600);
      } catch {
        showNotification('No se pudieron restablecer los datos. Inténtalo de nuevo.');
      }
    }
  };

  const handleLogout = async () => {
    const shouldLogout = window.confirm('¿Desea cerrar sesión?');

    if (!shouldLogout) {
      return;
    }

    try {
      await signOut(auth);
    } catch {
      showNotification('No se pudo cerrar sesión. Inténtalo de nuevo.');
    }
  };

  // Construye el texto del resumen (asunto + cuerpo) y abre el cliente de correo
  const handleSendSummaryEmail = () => {
    const subject = `Resumen de tareas — ${completionRate}% completado`;

    const lineasEncabezado = [
      `RESUMEN DE TAREAS`,
      `Generado el ${new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      ``,
      `Índice de productividad: ${completionRate}% (${completedTasks}/${totalTasks} completadas)`,
      `Pendientes: ${pendingTasks}`,
      `En progreso: ${inProgressTasks}`,
      `Completadas: ${completedTasks}`,
      `Vencidas: ${overdueTasks}`,
      `Subtareas: ${completedSubtasks}/${totalSubtasks} completadas`,
      ``,
    ];

    const lineasCategorias = [
      `POR CATEGORÍA`,
      ...categories.map((cat) => {
        const count = categoryCounts[cat] || 0;
        return `- ${CATEGORY_CONFIG[cat].label}: ${count}`;
      }),
      ``,
    ];

    const lineasPrioridad = [
      `POR PRIORIDAD`,
      ...priorities.map((p) => {
        const count = priorityCounts[p] || 0;
        return `- ${PRIORITY_CONFIG[p].label}: ${count}`;
      }),
      ``,
    ];

    // Si hay tareas vencidas, se listan por nombre (hasta 10, para no exceder el límite de mailto)
    const lineasVencidas = overdueTasks > 0
      ? [
        `TAREAS VENCIDAS`,
        ...overdueTasksList.slice(0, 10).map((t) => `- ${t.title}`),
        overdueTasksList.length > 10 ? `... y ${overdueTasksList.length - 10} más` : '',
        ``,
      ]
      : [];

    const body = [...lineasEncabezado, ...lineasCategorias, ...lineasPrioridad, ...lineasVencidas]
      .join('\n');

    // Se abre el compositor web de Gmail en una pestaña nueva, en vez de mailto:,
    // para no depender del cliente de correo predeterminado del sistema operativo
    // (algunos equipos con Outlook mal configurado quedan en bucle con mailto:).
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.open(gmailUrl, '_blank');
  };

  return (
    <div className="stats-page">
      {/* Toast Notificación */}
      {notification && (
        <div
          className="stats-notification"
        >
          {notification}
        </div>
      )}

      {/* Tarjeta de Tasa de Productividad */}
      <div
        className="stats-productivity-card"
      >
        <div>
          <div className="stats-productivity-kicker">
            <SparklesIcon size={14} />
            <span>Índice de Productividad</span>
          </div>
          <h2 className="stats-productivity-rate">
            {completionRate}%
          </h2>
          <p className="stats-productivity-copy">
            {completionRate === 100
              ? '¡Excelente! Has completado todas tus tareas.'
              : completionRate >= 50
                ? '¡Gran avance! Vas por más de la mitad del camino.'
                : 'Buen comienzo, ¡sigue tachando pendientes!'}
          </p>
        </div>

        {/* Gráfico circular estilizado */}
        <div className="stats-productivity-chart">
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
              className="stats-productivity-progress"
            />
          </svg>
          <div
            className="stats-productivity-count"
          >
            {completedTasks}/{totalTasks}
          </div>
        </div>
      </div>

      {/* Resumen en 4 Tarjetas */}
      <div className="stats-summary-grid">
        <div
          className="stats-summary-card"
        >
          <div className="stats-summary-label">PENDIENTES</div>
          <div className="stats-summary-value">
            {pendingTasks}
          </div>
          <div className="stats-summary-caption">
            Por iniciar
          </div>
        </div>

        <div
          className="stats-summary-card"
        >
          <div className="stats-summary-label is-progress">EN PROGRESO</div>
          <div className="stats-summary-value">
            {inProgressTasks}
          </div>
          <div className="stats-summary-caption">
            En desarrollo
          </div>
        </div>

        <div
          className="stats-summary-card"
        >
          <div className="stats-summary-label is-complete">COMPLETADAS</div>
          <div className="stats-summary-value is-complete">
            {completedTasks}
          </div>
          <div className="stats-summary-caption">
            Metas logradas
          </div>
        </div>

        <div
          className={`stats-summary-card ${overdueTasks > 0 ? 'has-overdue' : ''}`}
        >
          <div className={`stats-summary-label ${overdueTasks > 0 ? 'is-overdue' : ''}`}>
            VENCIDAS
          </div>
          <div
            className={`stats-summary-value ${overdueTasks > 0 ? 'is-overdue' : ''}`}
          >
            {overdueTasks}
          </div>
          <div className="stats-summary-caption">
            {overdueTasks > 0 ? 'Requieren atención' : '¡Todo al día!'}
          </div>
        </div>
      </div>

      {/* Métricas de Subtareas y Notas */}
      <div
        className="stats-section-card"
      >
        <h3 className="stats-section-title">
          Desglose General
        </h3>

        <div className="stats-vertical-list stats-general-list">
          <div>
            <div className="stats-progress-header">
              <span className="stats-secondary-text">Progreso de Subtareas</span>
              <span className="stats-emphasis-text">
                {completedSubtasks} de {totalSubtasks}
              </span>
            </div>
            <progress className="stats-progress-bar stats-subtask-progress" value={totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0} max={100} />
          </div>

          <div className="stats-notes-total">
            <span className="stats-secondary-text stats-inline-icon">
              <TagIcon size={14} /> Total de Notas en Bloc
            </span>
            <span className="stats-emphasis-text">
              {notes.length} ({notes.filter((n) => n.isPinned).length} fijadas)
            </span>
          </div>
        </div>
      </div>

      {/* Distribución por Categorías */}
      <div
        className="stats-section-card"
      >
        <h3 className="stats-section-title">
          Tareas por Categoría
        </h3>

        <div className="stats-vertical-list">
          {categories.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
            const conf = CATEGORY_CONFIG[cat];
            return (
              <div key={cat} className="stats-breakdown-row">
                <span className="stats-category-icon">{conf.icon}</span>
                <div className="stats-breakdown-content">
                  <div className="stats-progress-header stats-progress-header-tight">
                    <span className="stats-primary-text">{conf.label}</span>
                    <span className="stats-muted-text">{count} ({pct}%)</span>
                  </div>
                  <progress className={`stats-progress-bar category-progress category-${cat}`} value={pct} max={100} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Distribución por Prioridad */}
      <div
        className="stats-section-card"
      >
        <h3 className="stats-section-title">
          Tareas por Prioridad
        </h3>

        <div className="stats-vertical-list">
          {priorities.map((p) => {
            const count = priorityCounts[p] || 0;
            const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
            const conf = PRIORITY_CONFIG[p];
            return (
              <div key={p}>
                <div className="stats-progress-header stats-progress-header-tight">
                  <span className={`stats-priority-text priority-${p}`}>{conf.label}</span>
                  <span className="stats-muted-text">{count} ({pct}%)</span>
                </div>
                <progress className={`stats-progress-bar priority-progress priority-${p}`} value={pct} max={100} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Envío de resumen por correo */}
      <div
        className="stats-section-card"
      >
        <h3 className="stats-section-title stats-data-title">
          Compartir Resumen
        </h3>
        <p className="stats-data-description">
          Abre tu programa de correo con un resumen del estado de tus tareas ya redactado.
        </p>

        <div className="stats-data-actions">
          <button
            type="button"
            className="btn btn-primary stats-full-width-btn stats-email-btn"
            onClick={handleSendSummaryEmail}
          >
            <span className="stats-email-icon" aria-hidden="true">✉️</span>
            <span>Enviar Resumen por Correo</span>
          </button>
        </div>
      </div>

      {/* Gestión de Datos y Respaldos */}
      <div
        className="stats-section-card"
      >
        <h3 className="stats-section-title stats-data-title">
          Gestión de Datos
        </h3>
        <p className="stats-data-description">
          Exporta tu información a un archivo JSON o importa una copia existente.
        </p>

        <div className="stats-data-actions">
          <button type="button" className="btn btn-secondary stats-full-width-btn" onClick={handleExport}>
            <ExportIcon size={16} />
            <span>Exportar Copia de Seguridad</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            className="stats-hidden-file-input"
            onChange={handleImportFile}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary stats-full-width-btn"
          >
            <span>Importar Copia (JSON)</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="btn btn-danger stats-full-width-btn stats-reset-btn"
          >
            <ResetIcon size={16} />
            <span>Restablecer Datos de Demostración</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-secondary stats-full-width-btn"
          >
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};
