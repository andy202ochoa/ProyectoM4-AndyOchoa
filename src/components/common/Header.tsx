import React from 'react';
import { MoonIcon, SearchIcon, SunIcon, TasksIcon } from './Icons';
import { Theme } from '../../hooks/useTheme';

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  title: string;
  subtitle?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showSearch?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  showSearch = true,
}) => {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="header-logo">
          <TasksIcon size={20} />
        </div>
        <div>
          <h1 className="header-title">{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="header-actions">
        {showSearch && (
          <button
            type="button"
            className="icon-btn"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            title="Buscar"
            aria-label="Buscar"
          >
            <SearchIcon size={18} />
          </button>
        )}

        <button
          type="button"
          className="icon-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>
      </div>

      {isSearchOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            padding: '10px 16px',
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 35,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <SearchIcon size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ padding: '8px 12px' }}
            placeholder="Buscar por título, contenido o etiqueta..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              className="icon-btn"
              style={{ width: 30, height: 30 }}
              onClick={() => onSearchChange('')}
            >
              ×
            </button>
          )}
        </div>
      )}
    </header>
  );
};
