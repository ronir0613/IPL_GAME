import ThemeToggle from './ThemeToggle';

export default function NavBar({ currentPhase, onNavigate }: { currentPhase?: string, onNavigate?: (p: any) => void }) {
  const handleNavigate = (p: string) => {
    if (onNavigate) {
      onNavigate(p);
    } else {
      // If we are outside the React App (e.g., in Astro static pages), redirect using normal href
      window.location.href = p === 'home' ? '/' : `/?phase=${p}`;
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[60] h-16 bg-[var(--color-canvas)]/80 backdrop-blur-md border-b border-[var(--color-hairline)] px-4 sm:px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-6">
        <button onClick={() => handleNavigate('home')} className="text-[var(--color-ink)] font-semibold tracking-tight text-xl tracking-tighter hover:opacity-80 transition-opacity">
          16-0
        </button>
        <div className="hidden sm:flex items-center gap-1">
          <button 
            onClick={() => handleNavigate('home')}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${currentPhase === 'home' ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold' : 'text-[var(--color-body)] hover:bg-[var(--color-canvas-soft-2)] font-medium'}`}
          >
            Home
          </button>
          <button 
            onClick={() => handleNavigate('mode-select')}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${currentPhase === 'mode-select' || currentPhase === 'draft' || currentPhase === 'watching' ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold' : 'text-[var(--color-body)] hover:bg-[var(--color-canvas-soft-2)] font-medium'}`}
          >
            Play
          </button>
          <button 
            onClick={() => handleNavigate('leaderboard')}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${currentPhase === 'leaderboard' ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold' : 'text-[var(--color-body)] hover:bg-[var(--color-canvas-soft-2)] font-medium'}`}
          >
            Leaderboard
          </button>
          <button 
            onClick={() => handleNavigate('profile')}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${currentPhase === 'profile' ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold' : 'text-[var(--color-body)] hover:bg-[var(--color-canvas-soft-2)] font-medium'}`}
          >
            Profile
          </button>
        </div>
      </div>
      
      {/* Theme Toggle lives perfectly integrated on the right side */}
      <div className="flex items-center">
        <ThemeToggle />
      </div>
    </nav>
  );
}
