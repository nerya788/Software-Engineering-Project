import React from 'react';
import { useTheme } from '../context/ThemeContext';
// אני משתמש כאן באייקונים של lucide-react (ספרייה מעולה וקלה), אם אין לך תתקין או תחליף ל-SVG רגיל
import { Moon, Sun } from 'lucide-react'; 

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={() => toggleTheme(theme === 'dark' ? 'light' : 'dark')}
      className={`
        p-2 rounded-full transition-all duration-300 ease-in-out
        ${theme === 'dark' ? 'bg-surface-800 text-primary-300' : 'bg-surface-50 text-primary-600'}
        shadow-glass hover:shadow-soft hover:scale-105 border border-primary-100
      `}
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <Sun size={20} />
      ) : (
        <Moon size={20} />
      )}
    </button>
  );
};

export default ThemeToggle;