import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const handleStorage = () => {
      const savedTheme = localStorage.getItem('theme');
      const isDarkTheme = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      setIsDark(isDarkTheme);
      if (isDarkTheme) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Run once on mount
    handleStorage();

    // Sync across tabs and handle browser bfcache (Back/Forward navigation)
    window.addEventListener('storage', handleStorage);
    window.addEventListener('pageshow', handleStorage);
    
    // Also listen for Astro view transitions just in case they are ever added
    document.addEventListener('astro:after-swap', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('pageshow', handleStorage);
      document.removeEventListener('astro:after-swap', handleStorage);
    };
  }, []);

  const toggle = () => {
    const nextTheme = !isDark ? 'dark' : 'light';
    setIsDark(!isDark);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', nextTheme);
  };

  return (
    <button 
      onClick={toggle} 
      className="p-2 bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-full shadow-md text-[var(--color-ink)] hover:scale-105 transition-transform"
      aria-label="Toggle dark mode"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
