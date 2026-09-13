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
    default: return 'bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border-black/10 dark:border-white/10';
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
    <div className={`md:rounded-lg border flex flex-col items-center justify-between transition-transform ${getTierColor(tier)} ${glowClass} ${opacityClass} ${paddingClass} relative overflow-hidden group`}>
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
          <div className="text-sm font-black tracking-widest uppercase">× {count}</div>
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

  if (!profile) return <div className="p-8 text-center text-gray-500 dark:text-gray-400 font-mono font-bold tracking-widest uppercase">Loading profile...</div>;

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
    <div className="min-h-[calc(100vh-4rem)] max-w-4xl mx-auto pb-24 animate-fade-in pt-8 px-4 sm:px-6 font-mono">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {onBack ? (
          <button onClick={onBack} className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2 cursor-pointer">
            ← Back
          </button>
        ) : <div />}
        <button onClick={() => setShowPreviews(true)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 md:rounded-lg hover:bg-gray-50 dark:hover:bg-[#111] border border-transparent hover:border-black/10 dark:hover:border-white/10 cursor-pointer">
          <Info size={20} />
        </button>
      </div>
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-gray-900 dark:text-white mb-2">
          {profile.handle || 'Unknown Player'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
          <Trophy size={16} /> Hall of Fame
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Overview Stats */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 md:rounded-lg p-6 shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2">
              <Info size={14} /> Overview
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-[#111] p-3 md:rounded-lg border border-black/10 dark:border-white/10">
                <div className="text-2xl font-black text-gray-900 dark:text-white">{totalSeasons}</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-black">Seasons</div>
              </div>
              <div className="bg-gray-50 dark:bg-[#111] p-3 md:rounded-lg border border-black/10 dark:border-white/10">
                <div className="text-2xl font-black text-gray-900 dark:text-white">{bestRun ? `${bestRun.wins}-${bestRun.losses}` : 'N/A'}</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-black">Best Record</div>
              </div>
              <div className="bg-gray-50 dark:bg-[#111] p-3 md:rounded-lg border border-black/10 dark:border-white/10">
                <div className="text-2xl font-black text-gray-900 dark:text-white">{championships}</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-black">Titles</div>
              </div>
              <div className="bg-gray-50 dark:bg-[#111] p-3 md:rounded-lg border border-black/10 dark:border-white/10">
                <div className="text-2xl font-black text-gray-900 dark:text-white">{longestStreak}</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-black">Max Streak</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Cards & History */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Sharecard Collection */}
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
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
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <History size={14} /> {showAllRuns ? 'All Run History' : 'Recent Run History'}
              </h2>
              {profile.runs.length > 3 && (
                <button 
                  onClick={() => setShowAllRuns(!showAllRuns)}
                  className="text-[10px] uppercase font-black tracking-widest text-blue-600 dark:text-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  {showAllRuns ? 'Show Last 3 Runs' : 'Show All Runs'}
                </button>
              )}
            </div>
            
            {profile.runs.length === 0 ? (
              <div className="bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 md:rounded-lg p-8 text-center text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-sm">
                No seasons completed yet.
              </div>
            ) : (
              <div className={`space-y-3 ${showAllRuns ? 'max-h-[500px] overflow-y-auto custom-scrollbar pr-2' : ''}`}>
                {[...profile.runs].reverse().slice(0, showAllRuns ? undefined : 3).map((run) => (
                  <div key={run.id} className="bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 md:rounded-lg overflow-hidden shadow-sm transition-all">
                    
                    {/* Collapsed Header */}
                    <button 
                      onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#111] transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 md:rounded-lg ${
                          run.tier === 'Platinum' ? 'bg-gradient-to-br from-cyan-400 to-purple-500' :
                          run.tier === 'Gold' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          run.tier === 'Silver' ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                          run.tier === 'Bronze' ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                          'bg-gray-300 dark:bg-gray-700'
                        }`} />
                        <div>
                          <div className="font-black text-gray-900 dark:text-white text-lg">
                            {run.wins}-{run.losses}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                        {new Date(run.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {expandedRun === run.id && (
                      <div className="px-5 pb-5 pt-2 border-t border-black/10 dark:border-white/10 bg-gray-50 dark:bg-[#111]">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3 mt-2">Playing XI</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                          {run.playingXI.map((p, idx) => (
                            <div key={p.id} className="flex items-center justify-between py-1 border-b border-black/10 dark:border-white/10 border-dashed last:border-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-4">{idx + 1}.</span>
                                <span className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">{p.name}</span>
                              </div>
                              <div className="text-xs px-1.5 md:rounded-lg" style={{ backgroundColor: ratingColor(p.overall), color: '#fff', fontWeight: 'bold' }}>
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
      <div className="mt-20 pt-8 border-t border-black/10 dark:border-white/10 flex items-center justify-center gap-6 opacity-40 hover:opacity-100 transition-opacity">
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <Download size={14} /> Export Save
        </button>
        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">
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
          <div className="bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 md:rounded-lg w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-screen">
            <div className="p-4 border-b border-black/10 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-[#111]">
              <h2 className="font-black uppercase tracking-widest text-gray-900 dark:text-white flex items-center gap-2">
                <Star size={16} /> Sharecard Tiers
              </h2>
              <button onClick={() => setShowPreviews(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1 cursor-pointer">
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
