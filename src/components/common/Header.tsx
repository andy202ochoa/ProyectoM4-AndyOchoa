import React, { useState } from 'react';
import { MoonIcon, SearchIcon, SunIcon, TasksIcon } from './Icons';
import { Theme } from '../../hooks/useTheme';
import './components.css';

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
        <div className="header-search-overlay">
          <SearchIcon size={16} className="header-search-icon" />
          <input
            type="text"
            className="form-input header-search-input"
            placeholder="Buscar por título, contenido o etiqueta..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              className="icon-btn header-search-clear"
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
