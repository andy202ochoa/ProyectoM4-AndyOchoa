import { useEffect, useState } from 'react';
import { StorageService } from '../services';

export type Theme = 'dark' | 'light';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => StorageService.getTheme());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    StorageService.saveTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme, setTheme };
}
