import { useState, useEffect } from 'react';
import { Download, Upload, Trophy, Star, History, Info, X } from 'lucide-react';
import { 
  getProfileData, 
  exportProfileData, 
  importProfileData, 
  type PlayerProfileData,
  type CardTier
} from '@/lib/profile';
import type { Player } from '@/lib/types';
import { ratingColor } from '@/lib/engine';

function getTierColor(tier: CardTier) {
  switch (tier) {
    case 'Platinum': return 'mesh-gradient-multi text-white border-transparent';
    case 'Gold': return 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 text-yellow-950 border-yellow-400';
    case 'Silver': return 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-500 text-gray-900 border-gray-300';
    case 'Bronze': return 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-amber-100 border-amber-600';
    default: return 'bg-[var(--color-card-bg)] text-[var(--color-body)] border-[var(--color-card-border)]';
  }
}

function DummyShareCard({ tier, count, isPreview = false }: { tier: CardTier, count?: number, isPreview?: boolean }) {
  const isLocked = count === 0 && !isPreview;
  const opacityClass = isLocked ? 'opacity-30 grayscale cursor-not-allowed' : '';
  const paddingClass = isPreview ? 'p-6 min-h-[300px]' : 'p-3 aspect-[3/4] min-w-[100px] hover:-translate-y-1';
  
  // Dynamic glow based on tier
  const glowClass = !isLocked && tier === 'Platinum' ? 'shadow-[0_0_25px_rgba(168,85,247,0.6)]' :
                    !isLocked && tier === 'Gold' ? 'shadow-[0_0_20px_rgba(250,204,21,0.5)]' :
                    !isLocked && tier === 'Silver' ? 'shadow-[0_0_15px_rgba(156,163,175,0.4)]' :
                    !isLocked && tier === 'Bronze' ? 'shadow-[0_0_10px_rgba(217,119,6,0.3)]' :
                    'shadow-sm';

  // Dynamic shine overlay opacity based on tier
  const shineClass = tier === 'Platinum' ? 'via-white/80' :
                     tier === 'Gold' ? 'via-white/50' :
                     tier === 'Silver' ? 'via-white/30' :
                     tier === 'Bronze' ? 'via-white/10' :
                     'via-transparent';

  return (
    <div className={`rounded-xl border flex flex-col items-center justify-between transition-transform ${getTierColor(tier)} ${glowClass} ${opacityClass} ${paddingClass} relative overflow-hidden group`}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      
      {/* Shine effect that sweeps on hover */}
      {!isLocked && tier !== 'Standard' && (
        <div className={`absolute top-0 -left-[150%] h-full w-[150%] z-0 block transform -skew-x-12 bg-gradient-to-r from-transparent ${shineClass} to-transparent group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out pointer-events-none`} />
      )}
      
      <div className="w-full text-center relative z-10">
        <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">{tier}</div>
        <div className="h-px w-8 bg-current opacity-20 mx-auto mb-2" />
      </div>
      
      <div className="flex-1 flex items-center justify-center relative z-10">
        <Trophy size={isPreview ? 48 : 24} className={isPreview ? 'opacity-90' : 'opacity-60 group-hover:scale-110 transition-transform'} />
      </div>
      
      {!isPreview && count !== undefined && (
        <div className="w-full text-center relative z-10">
          <div className="text-sm font-black tracking-tight">× {count}</div>
        </div>
      )}
      
      {isPreview && (
        <div className="w-full text-center relative z-10">
          <div className="text-sm font-bold opacity-80 px-4">
            {tier === 'Platinum' && '16-0 Undefeated'}
            {tier === 'Gold' && 'Tournament Champion'}
            {tier === 'Silver' && 'Tournament Runner Up'}
            {tier === 'Bronze' && 'Made Playoffs'}
            {tier === 'Standard' && 'Did Not Qualify'}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlayerProfile({ onBack }: { onBack?: () => void }) {
  const [profile, setProfile] = useState<PlayerProfileData | null>(null);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [showAllRuns, setShowAllRuns] = useState(false);
  const [showPreviews, setShowPreviews] = useState(false);

  useEffect(() => {
    setProfile(getProfileData());
  }, []);

  const handleExport = () => {
    const data = exportProfileData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `160play_save_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (importProfileData(content)) {
        setProfile(getProfileData());
        alert('Save file imported successfully!');
      } else {
        alert('Invalid save file.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  if (!profile) return <div className="p-8 text-center text-[var(--color-mute)]">Loading profile...</div>;

  const totalSeasons = profile.runs.length;
  const championships = profile.runs.filter(r => r.champion).length;
  const bestRun = profile.runs.length > 0 
    ? profile.runs.reduce((best, curr) => (curr.wins > best.wins) ? curr : best, profile.runs[0])
    : null;
    
  let longestStreak = 0;
  let currentStreak = 0;
  for (const r of profile.runs) {
    if (r.champion) {
      currentStreak++;
      if (currentStreak > longestStreak) longestStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  const cardCounts = {
    Platinum: profile.runs.filter(r => r.tier === 'Platinum').length,
    Gold: profile.runs.filter(r => r.tier === 'Gold').length,
    Silver: profile.runs.filter(r => r.tier === 'Silver').length,
    Bronze: profile.runs.filter(r => r.tier === 'Bronze').length,
    Standard: profile.runs.filter(r => r.tier === 'Standard').length,
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 animate-fade-in pt-8 px-4 sm:px-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {onBack ? (
          <button onClick={onBack} className="text-sm font-bold uppercase tracking-widest text-[var(--color-mute)] hover:text-[var(--color-ink)] transition-colors flex items-center gap-2">
            ← Back
          </button>
        ) : <div />}
        <button onClick={() => setShowPreviews(true)} className="text-[var(--color-mute)] hover:text-[var(--color-ink)] transition-colors p-2 rounded-full hover:bg-[var(--color-canvas-soft)]">
          <Info size={20} />
        </button>
      </div>
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-[var(--color-ink)] tracking-tighter mb-2">
          {profile.handle || 'Unknown Player'}
        </h1>
        <p className="text-[var(--color-mute)] flex items-center justify-center gap-2">
          <Trophy size={16} /> Hall of Fame
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Overview Stats */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-2xl p-6 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-mute)] mb-6 flex items-center gap-2">
              <Info size={14} /> Overview
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
              <div className="bg-[var(--color-canvas)] p-3 rounded-xl border border-[var(--color-hairline)]">
                <div className="text-2xl font-bold text-[var(--color-ink)]">{totalSeasons}</div>
                <div className="text-[10px] text-[var(--color-mute)] uppercase tracking-wider font-bold">Seasons</div>
              </div>
              <div className="bg-[var(--color-canvas)] p-3 rounded-xl border border-[var(--color-hairline)]">
                <div className="text-2xl font-bold text-[var(--color-ink)]">{bestRun ? `${bestRun.wins}-${bestRun.losses}` : 'N/A'}</div>
                <div className="text-[10px] text-[var(--color-mute)] uppercase tracking-wider font-bold">Best Record</div>
              </div>
              <div className="bg-[var(--color-canvas)] p-3 rounded-xl border border-[var(--color-hairline)]">
                <div className="text-2xl font-bold text-[var(--color-ink)]">{championships}</div>
                <div className="text-[10px] text-[var(--color-mute)] uppercase tracking-wider font-bold">Titles</div>
              </div>
              <div className="bg-[var(--color-canvas)] p-3 rounded-xl border border-[var(--color-hairline)]">
                <div className="text-2xl font-bold text-[var(--color-ink)]">{longestStreak}</div>
                <div className="text-[10px] text-[var(--color-mute)] uppercase tracking-wider font-bold">Max Streak</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Cards & History */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Sharecard Collection */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-mute)] mb-4 flex items-center gap-2">
              <Star size={14} /> Collection
            </h2>
            <div className="flex flex-wrap gap-3">
              {(Object.entries(cardCounts) as [CardTier, number][]).map(([tier, count]) => (
                <DummyShareCard key={tier} tier={tier} count={count} />
              ))}
            </div>
          </div>

          {/* Run History */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-mute)] flex items-center gap-2">
                <History size={14} /> {showAllRuns ? 'All Run History' : 'Recent Run History'}
              </h2>
              {profile.runs.length > 3 && (
                <button 
                  onClick={() => setShowAllRuns(!showAllRuns)}
                  className="text-[10px] uppercase font-bold text-[var(--color-link)] hover:text-[var(--color-link-deep)] transition-colors"
                >
                  {showAllRuns ? 'Show Last 3 Runs' : 'Show All Runs'}
                </button>
              )}
            </div>
            
            {profile.runs.length === 0 ? (
              <div className="bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-2xl p-8 text-center text-[var(--color-mute)]">
                No seasons completed yet.
              </div>
            ) : (
              <div className={`space-y-3 ${showAllRuns ? 'max-h-[500px] overflow-y-auto custom-scrollbar pr-2' : ''}`}>
                {[...profile.runs].reverse().slice(0, showAllRuns ? undefined : 3).map((run) => (
                  <div key={run.id} className="bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-xl overflow-hidden shadow-sm transition-all">
                    
                    {/* Collapsed Header */}
                    <button 
                      onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-[var(--color-canvas-soft)] transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          run.tier === 'Platinum' ? 'bg-gradient-to-br from-cyan-400 to-purple-500' :
                          run.tier === 'Gold' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          run.tier === 'Silver' ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                          run.tier === 'Bronze' ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                          'bg-[var(--color-hairline-strong)]'
                        }`} />
                        <div>
                          <div className="font-bold text-[var(--color-ink)] text-lg">
                            {run.wins}-{run.losses}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-mono text-[var(--color-mute)]">
                        {new Date(run.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {expandedRun === run.id && (
                      <div className="px-5 pb-5 pt-2 border-t border-[var(--color-hairline)] bg-[var(--color-canvas-soft-2)]">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-mute)] mb-3 mt-2">Playing XI</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                          {run.playingXI.map((p, idx) => (
                            <div key={p.id} className="flex items-center justify-between py-1 border-b border-[var(--color-hairline)] border-dashed last:border-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-[var(--color-mute)] w-4">{idx + 1}.</span>
                                <span className="text-sm font-semibold text-[var(--color-ink)]">{p.name}</span>
                              </div>
                              <div className="text-xs px-1.5 rounded" style={{ backgroundColor: ratingColor(p.overall), color: '#fff', fontWeight: 'bold' }}>
                                {p.overall}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Export / Import Save Data */}
      <div className="mt-20 pt-8 border-t border-[var(--color-hairline)] flex items-center justify-center gap-6 opacity-40 hover:opacity-100 transition-opacity">
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-mute)] hover:text-[var(--color-ink)] transition-colors"
        >
          <Download size={14} /> Export Save
        </button>
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-mute)] hover:text-[var(--color-ink)] transition-colors cursor-pointer">
          <Upload size={14} /> Import Save
          <input 
            type="file" 
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>

      {/* Previews Modal */}
      {showPreviews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-screen">
            <div className="p-4 border-b border-[var(--color-hairline)] flex justify-between items-center bg-[var(--color-canvas-soft)]">
              <h2 className="font-bold uppercase tracking-widest text-[var(--color-ink)] flex items-center gap-2">
                <Star size={16} /> Sharecard Tiers
              </h2>
              <button onClick={() => setShowPreviews(false)} className="text-[var(--color-mute)] hover:text-[var(--color-ink)] transition-colors p-1">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {(['Platinum', 'Gold', 'Silver', 'Bronze', 'Standard'] as CardTier[]).map(tier => (
                  <DummyShareCard key={tier} tier={tier} isPreview />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
