import React from 'react';
import { TaskCategory, TaskPriority, TaskStatus } from '../../types';
import { CATEGORY_CONFIG, PRIORITY_CONFIG, STATUS_CONFIG } from '../../utils';
import './Badge.css';

interface PriorityBadgeProps {
  priority: TaskPriority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span
      className="badge"
      style={{
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.color}33`,
      }}
    >
      <span className="badge-dot" style={{ backgroundColor: config.color }} />
      {config.label}
    </span>
  );
};

interface CategoryBadgeProps {
  category: TaskCategory;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const config = CATEGORY_CONFIG[category] || { label: category, color: '#6366f1', icon: '📌' };
  return (
    <span
      className="badge"
      style={{
        backgroundColor: `${config.color}15`,
        color: config.color,
        border: `1px solid ${config.color}25`,
      }}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
};

interface StatusBadgeProps {
  status: TaskStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className="badge"
      style={{
        backgroundColor: `${config.color}18`,
        color: config.color,
      }}
    >
      {config.label}
    </span>
  );
};

interface TagBadgeProps {
  label: string;
  onRemove?: () => void;
}

export const TagBadge: React.FC<TagBadgeProps> = ({ label, onRemove }) => {
  return (
    <span className="badge badge-tag">
      #{label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="badge-tag-remove"
          aria-label={`Eliminar etiqueta ${label}`}
        >
          ×
        </button>
      )}
    </span>
  );
};
