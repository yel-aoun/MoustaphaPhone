import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { storagePrefix } from '@/lib/brand';

const THEME_KEY = `${storagePrefix}_theme`;

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  // Cross-fade between themes instead of flashing the whole screen bright or dark
  const toggleTheme = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduce) { setIsDark((v) => !v); return; }
    document.startViewTransition(() => flushSync(() => setIsDark((v) => !v)));
  };

  return { isDark, toggleTheme };
}
