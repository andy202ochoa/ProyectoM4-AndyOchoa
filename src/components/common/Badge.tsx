import React from 'react';
import { TaskCategory, TaskPriority, TaskStatus } from '../../types';
import { CATEGORY_CONFIG, PRIORITY_CONFIG, STATUS_CONFIG } from '../../utils';

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
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: config.color }} />
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
    <span
      className="badge"
      style={{
        backgroundColor: 'var(--bg-input)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border-color)',
      }}
    >
      #{label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '0 2px',
            marginLeft: '4px',
            fontSize: '12px',
          }}
        >
          ×
        </button>
      )}
    </span>
  );
};
