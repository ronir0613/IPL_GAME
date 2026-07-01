import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react';
import { Swords, Target, Trophy, Zap, Hand, TrendingUp, Pause, Play, Dices, ClipboardList, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { generateGambleTeam } from '@/lib/gamble';
import type { GambleResult } from '@/lib/gamble';

import type {
  Player, Role, SquadSlot, SeasonTeam, MatchResult, PlayoffMatch, MatchHighlight,
  GamePhase, GameSettings, Difficulty, ShowRatings, SimSpeed, GameMode, MatchPrepConfig,
  TeamStrength, PlayerStats, RainEvent, StoryItem
} from '@/lib/types';

import {
  calcSquadStrength, calcOdds, generateLeague, generateFixtures,
  simulateMatch, applyResult, sortTable, simulatePlayoffs, accumulateStats,
  generatePlayerStats, generateAwards, generateStory, ratingColor, initials
} from '@/lib/engine';

import type { PlayerForm } from '@/lib/form';
import {
  initPlayerForms,
  updateAllForms,
  getFormCategory,
  getFormGrade,
  getFormTrend,
  getTrendColor,
  getCategoryColor,
  getFormBarColor,
} from '@/lib/form';

// --- Rain Badge ----------------------------------------------
function RainBadge({ event }: { event: RainEvent }) {
  if (event.type === 'abandoned') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-400 rounded text-xs font-bold border border-red-500/20">
        <span className="text-sm">🌧</span>
        Abandoned - {event.description}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-500/10 text-teal-400 rounded text-xs font-bold border border-teal-500/20">
      <span className="text-sm">🌧</span>
      DLS Method - {event.description}
    </div>
  );
}

// ─── Rating Badge ────────────────────────────────────────────
function RatingBadge({ rating, size = 'md', hidden = false }: { rating: number; size?: 'sm' | 'md' | 'lg', hidden?: boolean }) {

  const bg = hidden ? '#374151' : ratingColor(rating);

  const dims = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm';

  return (

    <div
      className={`${dims} rounded-lg flex items-center justify-center font-bold flex-shrink-0`}
      style={{ background: bg }}
    >
      {hidden ? '?' : rating}
    </div>
  );
}

// ─── Form Sparkline ─────────────────────────────────────────────────────────
function FormSparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null;
  const w = 48, h = 18;
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 100);
  const range = max - min || 1;
  const pts = scores.map((v, i) => {
    const x = (i / (scores.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const last = scores[scores.length - 1];
  const prev = scores[scores.length - 2];
  const lineColor = last >= prev ? '#22c55e' : '#ef4444';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.8" />
      <circle cx={w} cy={h - ((last - min) / range) * h} r="2" fill={lineColor} />
    </svg>
  );
}

// ─── Player Form Inline ──────────────────────────────────────────────────────
// Compact inline form display. No separate cards — analytics strip style.
function PlayerFormInline({ form, compact = false }: {
  form: PlayerForm | undefined;
  compact?: boolean;
}) {
  if (!form) return null;

  const catColor = getCategoryColor(form.category);
  const trendColor = getTrendColor(form.trend);
  const barColor = getFormBarColor(form.score);
  const sign = form.trendDelta >= 0 ? '+' : '';

  const sparkScores = [...form.last5].reverse().map(p => {
    if (p.runs !== undefined && p.wickets !== undefined) {
      return Math.min(100, (p.runs ?? 0) * 0.6 + (p.wickets ?? 0) * 20);
    }
    if (p.runs !== undefined) return Math.min(100, (p.runs) * 0.85);
    if (p.wickets !== undefined) return Math.min(100, (p.wickets) * 25 + 15);
    return 0;
  });

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 mt-0.5">
        <span
          className="text-[9px] font-black px-1.5 py-0.5 rounded tabular-nums"
          style={{ background: catColor + '22', color: catColor, border: `1px solid ${catColor}44` }}
        >
          {form.grade}
        </span>
        <span className="text-[9px] font-bold tabular-nums" style={{ color: trendColor }}>
          {form.trend} {sign}{Math.abs(form.trendDelta)}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{form.score}</span>
      </div>
    );
  }

  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 tabular-nums"
          style={{ background: catColor + '20', color: catColor, border: `1px solid ${catColor}40` }}
        >
          {form.grade}
        </span>
        <span className="text-[11px] font-black tabular-nums" style={{ color: catColor }}>
          {form.score}
        </span>
        <div className="flex-1 h-1 rounded-full bg-[var(--card-bg)] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: barColor }}
            initial={{ width: 0 }}
            animate={{ width: `${form.score}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <span className="text-[10px] font-bold shrink-0" style={{ color: trendColor }}>
          {form.trend} {sign}{Math.abs(form.trendDelta)}
        </span>
        {sparkScores.length >= 2 && (
          <div className="shrink-0">
            <FormSparkline scores={sparkScores} />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: catColor + 'bb' }}>
          {form.category}
        </span>
        {form.last5.length > 0 ? (
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-gray-600 font-bold">Last {form.last5.length}:</span>
            {form.last5.map((p, i) => (
              <span key={i} className="text-[9px] font-mono text-[var(--text-muted)]">
                {i > 0 && <span className="text-gray-700 mx-0.5">|</span>}
                {p.label}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[9px] text-gray-600">No matches yet</span>
        )}
      </div>
    </div>
  );
}


const TEAM_COLORS: Record<string, string> = {
  MI: '#004BA0', CSK: '#F7C600', RCB: '#CC0000', KKR: '#3A225D',
  DC: '#00008B', PBKS: '#AA2829', RR: '#254AA5', SRH: '#F7A721',
  GT: '#1C3A6A', LSG: '#4B9CD3', 'YOUR XI': '#f5c842',
  RPS: '#E03A3E', GL: '#E8461E', PWI: '#8B0000', KTK: '#6A0DAD',
  DCH: '#F7A721', 'Deccan Chargers': '#F7A721',
};
function teamColor(short: string) {
  return TEAM_COLORS[short] || '#374151';
}

const FIELDING_POSITIONS = [
  { position: 'SLIP 1', x: 45, y: 15 },
  { position: 'FINE LEG', x: 80, y: 15 },
  { position: 'THIRD MAN', x: 20, y: 15 },
  { position: 'COVER', x: 15, y: 40 },
  { position: 'POINT', x: 5, y: 55 },
  { position: 'GULLY', x: 15, y: 25 },
  { position: 'MID WKT', x: 75, y: 45 },
  { position: 'SQ LEG', x: 85, y: 35 },
  { position: 'MID OFF', x: 30, y: 70 },
  { position: 'MID ON', x: 70, y: 70 },
  { position: 'DEEP COVER', x: 10, y: 70 },
  { position: 'LONG OFF', x: 35, y: 90 },
  { position: 'LONG ON', x: 65, y: 90 },
];

export function generatePitch(settings?: GameSettings): SquadSlot[] {
  const slots: SquadSlot[] = [];
  slots.push({ position: 'WK', x: 50, y: 5, player: null }); // fixed top
  
  // Pick 9 random unique positions from the pool
  const pool = [...FIELDING_POSITIONS].sort(() => Math.random() - 0.5).slice(0, 9);
  pool.forEach(p => slots.push({ position: p.position, x: p.x, y: p.y, player: null }));
  
  slots.push({ position: 'BOWLER', x: 50, y: 85, player: null }); // fixed bottom

  if (settings?.mode === 'franchise') {
    for (let i = 0; i < 14; i++) {
      slots.push({ position: 'BENCH' as any, x: -10, y: -10, player: null });
    }
  }

  return slots;
}

// ─── Progress Bar ─────────────────────────────────────────────
function ProgressBar({ value, color = '#f5c842' }: { value: number; color?: string }) {
  return (
    <div className="progress-bar-track w-full">
      <motion.div
        className="progress-bar-fill"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}

function WheelLayout({ squad, onSlotClick, settings, selectedSlot }: {
  squad: SquadSlot[];
  onSlotClick?: (idx: number) => void;
  settings?: GameSettings;
  selectedSlot?: number | null;
}) {
  return (
    <div className="rounded-2xl flex flex-col items-center justify-center h-[380px] w-full relative overflow-hidden bg-[var(--color-canvas)] border border-[var(--color-hairline)] [box-shadow:var(--shadow-vercel-3)] p-4">
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[340px] h-[340px] rounded-full bg-[var(--color-primary)] opacity-5 blur-2xl" />
      </div>
      
      <div className="w-[320px] h-[320px] relative rounded-full overflow-hidden shadow-2xl border-4 border-[var(--color-canvas-soft)] bg-[var(--color-canvas-soft-2)] ring-4 ring-[var(--color-hairline)]">
        {squad.map((slot, idx) => {
          const filled = !!slot.player;
          const hideRatings = settings?.showRatings === 'off';
          const isSelected = selectedSlot === idx;
          const rotation = idx * (360 / 11);

          return (
            <motion.div
              key={idx}
              className="absolute inset-0 origin-center pointer-events-none"
              style={{ 
                transform: `rotate(${rotation}deg)`,
              }}
            >
              <motion.div
                onClick={() => onSlotClick?.(idx)}
                className={`absolute inset-0 origin-center transition-all duration-300 pointer-events-auto ${onSlotClick ? 'cursor-pointer' : 'cursor-default'}`}
                style={{
                  clipPath: 'polygon(50% 50%, 34% 0%, 66% 0%)',
                  background: isSelected 
                    ? 'rgba(34,197,94,0.4)' 
                    : (filled ? (slot.player!.is_overseas ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.08)') : 'transparent'),
                  border: isSelected ? '1px solid #22c55e' : 'none'
                }}
                whileHover={!isSelected ? { 
                  background: filled 
                    ? (slot.player!.is_overseas ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.15)') 
                    : 'rgba(255,255,255,0.05)' 
                } : {}}
              >
                {/* Separator Lines */}
                <div className="absolute top-0 bottom-1/2 left-0 right-0 border-r border-dashed border-[var(--color-hairline)] opacity-40 pointer-events-none" style={{ transform: 'translateX(-50%)' }} />

                {/* Content Container */}
                <div 
                  className="absolute"
                  style={{
                    top: '16%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    width: '60px'
                  }}
                >
                  {filled ? (
                    <div className="flex flex-col items-center bg-[var(--color-canvas)]/60 backdrop-blur-sm rounded-lg px-2 py-1 border border-[var(--color-hairline)] [box-shadow:var(--shadow-vercel-1)]">
                      <span className={`text-[11px] font-bold tracking-tight truncate w-full text-center ${slot.player!.is_overseas ? 'text-blue-500' : 'text-[var(--color-ink)]'}`}>{initials(slot.player!.name)}</span>
                      <span className="text-[10px] font-mono font-bold text-[var(--color-mute)]">{hideRatings ? '?' : slot.player!.overall}</span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full border border-dashed border-[var(--color-mute)] opacity-30 flex items-center justify-center">
                      <span className="text-[10px] text-[var(--color-mute)] font-bold tracking-tighter uppercase">{['I','II','III','IV','V','VI','VII','VIII','IX','X','XI'][idx]}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })}

        {/* Center Circle XI */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80px] h-[80px] bg-[var(--color-canvas)] rounded-full border border-[var(--color-hairline)] shadow-[0_0_30px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center z-20 pointer-events-none backdrop-blur-md">
          <span className="text-3xl font-black text-[var(--color-primary)] tracking-tighter">XI</span>
          <span className="text-[8px] font-mono text-[var(--color-mute)] uppercase tracking-widest mt-1">Squad</span>
        </div>
      </div>
    </div>
  );
}

function BenchLayout({ squad, onSlotClick, settings, selectedSlot }: {
  squad: SquadSlot[];
  onSlotClick?: (idx: number) => void;
  settings?: GameSettings;
  selectedSlot?: number | null;
}) {
  const benchSlots = squad.map((s, i) => ({ s, i })).filter(({ s }) => s.position === 'BENCH');
  if (benchSlots.length === 0 || settings?.mode !== 'franchise') return null;

  return (
    <div className="mt-6 w-full bg-[var(--color-canvas)] p-4 rounded-2xl border border-[var(--color-hairline)] [box-shadow:var(--shadow-vercel-2)]">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-bold text-[var(--color-mute)] uppercase tracking-widest flex items-center gap-2">
          <Moon size={14} className="text-[var(--color-primary)]" /> Franchise Bench
        </div>
        <div className="text-[10px] font-mono bg-[var(--color-canvas-soft-2)] px-2 py-1 rounded-md text-[var(--color-ink)] font-bold border border-[var(--color-hairline)]">
          {benchSlots.filter(x => x.s.player).length} / 14 Filled
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2 justify-center">
        {benchSlots.map(({ s: slot, i: idx }) => {
          const filled = !!slot.player;
          const hideRatings = settings?.showRatings === 'off';
          const isSelected = selectedSlot === idx;
          return (
            <motion.div
              key={idx}
              onClick={() => onSlotClick?.(idx)}
              className={`flex flex-col items-center justify-center p-1.5
                ${onSlotClick ? 'cursor-pointer hover:border-yellow-500/50 hover:bg-yellow-500/5' : 'cursor-default'}
                w-full aspect-[3/4] rounded-xl relative overflow-hidden transition-all shadow-sm`}
              style={{ 
                border: filled 
                  ? (isSelected ? '2px solid #22c55e' : (slot.player!.is_overseas ? '1px solid rgba(59,130,246,0.3)' : '1px solid var(--color-hairline)')) 
                  : '1px dashed var(--color-hairline)',
                background: filled 
                  ? (isSelected ? 'rgba(34,197,94,0.1)' : (slot.player!.is_overseas ? 'rgba(59,130,246,0.05)' : 'var(--color-canvas-soft-2)')) 
                  : 'var(--color-canvas-soft)',
              }}
              whileHover={!isSelected ? { scale: 1.02, y: -2 } : {}}
            >
              {filled ? (
                <>
                  <div className="w-8 h-8 bg-[var(--color-canvas)] rounded-full border border-[var(--color-hairline)] shadow-sm flex items-center justify-center mb-1 relative">
                    <span className="text-[10px] font-mono font-bold text-[var(--color-ink)]">{hideRatings ? '?' : slot.player!.overall}</span>
                    {slot.player!.is_overseas && (
                      <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] shadow-sm">✈️</div>
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-[var(--color-ink)] text-center w-full truncate px-1">{initials(slot.player!.name)}</span>
                </>
              ) : (
                <span className="text-[10px] font-mono text-[var(--color-mute)]/40 font-bold">{idx + 1}</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function LeaderboardScreen({ onBack }: { onBack: () => void }) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [filterMode, setFilterMode] = useState('All modes');
  const [filterDiff, setFilterDiff] = useState('All difficulties');
  const [filterRatings, setFilterRatings] = useState('Any ratings');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        setLeaderboard(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  const filteredLeaderboard = useMemo(() => {
    return leaderboard.filter(entry => {
      const eMode = entry.mode || 'classic';
      const eDiff = entry.difficulty || 'normal';
      const eRatings = entry.showRatings || 'on';

      if (filterMode !== 'All modes' && eMode.toLowerCase() !== filterMode.toLowerCase()) return false;
      if (filterDiff !== 'All difficulties' && eDiff.toLowerCase() !== filterDiff.toLowerCase()) return false;
      if (filterRatings === 'Ratings On' && eRatings === 'off') return false;
      if (filterRatings === 'Ratings Off' && eRatings !== 'off') return false;
      
      return true;
    });
  }, [leaderboard, filterMode, filterDiff, filterRatings]);

  return (
    <div className="min-h-screen flex flex-col items-center py-16 px-4 md:px-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        {/* Header */}
        <div className="mb-12 relative mt-8">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gradient-to-r from-[#007cf0] via-[#7928ca] to-[#ff0080] blur-[100px] opacity-10 -z-10 rounded-full" />
           <h2 className="text-4xl md:text-[48px] leading-tight font-semibold tracking-[-2.4px] text-[var(--color-ink)] mb-4 text-center">
             16-0 Global Leaderboard.
           </h2>
           <p className="text-[var(--color-body)] text-[18px] text-center max-w-2xl mx-auto">Best all-time top-flight XIs, ranked by points.</p>
        </div>

        {/* Filters */}
        <div className="mb-8 w-full flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-mute)]">Filters</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'All modes' },
              { label: 'Classic' },
              { label: 'Franchise' },
              { label: 'Gamble' }
            ].map(f => (
              <button 
                key={f.label}
                onClick={() => setFilterMode(f.label)}
                className={`px-4 py-1.5 rounded-full text-[14px] transition-colors shadow-sm ${filterMode === f.label ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] font-medium' : 'bg-[var(--color-canvas)] text-[var(--color-ink)] border border-[var(--color-hairline)] hover:bg-[var(--color-canvas-soft-2)]'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Table */}
        {loading ? (
          <div className="text-center text-[var(--color-mute)] py-20 font-medium bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-[12px] shadow-[var(--shadow-vercel-2)]">Loading leaderboard...</div>
        ) : filteredLeaderboard.length === 0 ? (
          <div className="text-center text-[var(--color-mute)] py-20 font-medium bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-[12px] shadow-[var(--shadow-vercel-2)]">No records yet. Go play a season!</div>
        ) : (
          <div className="bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-[12px] overflow-hidden shadow-[var(--shadow-vercel-3)] mb-12">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-[var(--color-canvas-soft)] border-b border-[var(--color-hairline)] text-[var(--color-mute)] text-[12px] font-mono uppercase tracking-widest">
                   <th className="px-6 py-4 w-16 text-center">Rank</th>
                   <th className="px-6 py-4">Player</th>
                   <th className="px-6 py-4 text-right">Result</th>
                   <th className="px-6 py-4 text-right">Points</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[var(--color-hairline)]">
                 {filteredLeaderboard.map((entry, idx) => {
                   let rankDisplay: React.ReactNode = idx + 1;
                   if (idx === 0) rankDisplay = <span className="text-xl">🥇</span>;
                   else if (idx === 1) rankDisplay = <span className="text-xl">🥈</span>;
                   else if (idx === 2) rankDisplay = <span className="text-xl">🥉</span>;

                   return (
                     <tr key={entry.id || idx} className="hover:bg-[var(--color-canvas-soft-2)] transition-colors group">
                       <td className="px-6 py-4 font-mono font-medium text-[var(--color-ink)] text-center text-[14px]">{rankDisplay}</td>
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold text-[16px] ${entry.wins === 16 && entry.losses === 0 ? 'text-[#facc15] drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' : 'text-[var(--color-ink)]'}`}>{entry.handle || 'Anonymous'}</span>
                            {entry.champion && <span className="text-[#0070f3] font-bold" title="Champion">✓</span>}
                            <span className="bg-[var(--color-canvas-soft)] text-[var(--color-mute)] border border-[var(--color-hairline)] font-mono text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider">{entry.mode}</span>
                          </div>
                          <div className="text-[14px] text-[var(--color-body)] mt-1">
                            {entry.overall ? `${entry.overall} rated` : 'Unknown rating'} · {entry.mode === 'gamble' ? 'Gamble' : 'Normal'}
                          </div>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <div className={`font-medium flex items-center justify-end gap-1.5 ${entry.wins === 16 && entry.losses === 0 ? 'text-[#0070f3]' : 'text-[var(--color-ink)]'}`}>
                            {entry.wins}-{entry.losses} {entry.wins === 16 && entry.losses === 0 && <span className="text-[14px]">✨</span>}
                          </div>
                          <div className="text-[12px] text-[var(--color-mute)] mt-1 uppercase font-mono">
                            {(() => {
                              const posStr = entry.position + (['st','nd','rd'][entry.position-1]||'th');
                              const finishStr = entry.finish || (entry.champion ? 'Champions' : posStr);
                              return finishStr.toLowerCase() === posStr.toLowerCase() ? finishStr : `${posStr} · ${finishStr}`;
                            })()}
                          </div>
                       </td>
                       <td className="px-6 py-4 text-right font-semibold text-[var(--color-ink)] text-[16px]">
                          {entry.points}
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function HomeScreen({ onPlay, onLeaderboard, hasActiveGame, onContinue }: { onPlay: () => void, onLeaderboard: () => void, hasActiveGame?: boolean, onContinue?: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 space-y-12 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <div className="text-7xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 drop-shadow-lg mb-2">
          16-0
        </div>
        <div className="text-[var(--text-muted)] text-lg md:text-xl font-bold tracking-widest uppercase mb-10">The Perfect IPL Season</div>
        
        <div className="flex flex-col items-center gap-4 mt-8">
          {hasActiveGame ? (
            <>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={onContinue}
                className="btn-primary text-xl font-black px-16 py-4 w-full max-w-md uppercase tracking-widest shadow-xl pulse-gold"
              >
                CONTINUE DRAFTING
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={onPlay}
                className="btn-secondary text-lg font-bold px-16 py-3 w-full max-w-md uppercase tracking-widest shadow-xl"
              >
                START NEW
              </motion.button>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={onPlay}
              className="btn-primary text-2xl font-black px-16 py-5 pulse-gold w-full max-w-md uppercase tracking-widest shadow-2xl"
            >
              PLAY
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={onLeaderboard}
            className="btn-secondary text-lg font-bold px-12 py-3 w-full max-w-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl"
          >
            <Trophy size={20} className="text-yellow-500" />
            Leaderboard
          </motion.button>
          
          <a href="/explore">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="text-[var(--text-muted)] hover:text-[var(--text-muted)] text-xs uppercase tracking-widest font-bold flex items-center gap-2 mt-4"
            >
              <span>Explore Player Database</span>
              <span>→</span>
            </motion.div>
          </a>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-12">
            <a href="/about-us" className="text-[var(--text-muted)] hover:text-yellow-500 text-xs font-bold uppercase tracking-wider transition-colors">About Us</a>
            <a href="/contact-us" className="text-[var(--text-muted)] hover:text-yellow-500 text-xs font-bold uppercase tracking-wider transition-colors">Contact Us</a>
            <a href="/privacy-policy" className="text-[var(--text-muted)] hover:text-yellow-500 text-xs font-bold uppercase tracking-wider transition-colors">Privacy Policy</a>
            <a href="/terms-and-conditions" className="text-[var(--text-muted)] hover:text-yellow-500 text-xs font-bold uppercase tracking-wider transition-colors">Terms & Conditions</a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Mode Select Screen ──────────────────────────────────────────────
function ModeSelectScreen({ onSelectMode }: { onSelectMode: (mode: GameMode) => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl"
      >
        <div className="text-5xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 drop-shadow-lg mb-12 uppercase">
          PLAY
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full h-[500px]">
          
          {/* Classic */}
          <motion.button
            onClick={() => onSelectMode('classic')}
            whileHover={{ scale: 1.05 }}
            className="relative flex flex-col items-center justify-center p-8 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-md overflow-hidden group transition-all duration-300 hover:border-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="text-8xl font-black text-[var(--text-primary)]/5 mb-6 group-hover:text-blue-500/20 transition-colors">C</div>
            <Swords size={48} className="text-[var(--text-muted)] mb-6 group-hover:text-blue-400 transition-colors" />
            <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2 tracking-widest uppercase">Classic</h2>
            <p className="text-[var(--text-muted)] text-sm font-medium">Build the greatest XI.</p>
          </motion.button>

          {/* Franchise */}
          <motion.button
            onClick={() => onSelectMode('franchise')}
            whileHover={{ scale: 1.05 }}
            className="relative flex flex-col items-center justify-center p-8 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-md overflow-hidden group transition-all duration-300 hover:border-yellow-500 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="text-8xl font-black text-[var(--text-primary)]/5 mb-6 group-hover:text-yellow-500/20 transition-colors">F</div>
            <ClipboardList size={48} className="text-[var(--text-muted)] mb-6 group-hover:text-yellow-400 transition-colors" />
            <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2 tracking-widest uppercase">Franchise</h2>
            <p className="text-[var(--text-muted)] text-sm font-medium">Master the Impact Player rule.</p>
          </motion.button>

          {/* Gamble */}
          <motion.button
            onClick={() => onSelectMode('gamble')}
            whileHover={{ scale: 1.05 }}
            className="relative flex flex-col items-center justify-center p-8 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-md overflow-hidden group transition-all duration-300 hover:border-purple-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="text-8xl font-black text-[var(--text-primary)]/5 mb-6 group-hover:text-purple-500/20 transition-colors">G</div>
            <Dices size={48} className="text-[var(--text-muted)] mb-6 group-hover:text-purple-400 transition-colors" />
            <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2 tracking-widest uppercase">Gamble</h2>
            <p className="text-[var(--text-muted)] text-sm font-medium">Let fate decide.</p>
          </motion.button>

        </div>
      </motion.div>
    </div>
  );
}

// ─── Mode Settings Screen ──────────────────────────────────────────────
function ModeSettingsScreen({ settings, setSettings, onStart, mode }: { settings: GameSettings, setSettings: (s: GameSettings) => void, onStart: () => void, mode: GameMode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 space-y-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-4xl font-black tracking-tighter text-[var(--text-primary)] drop-shadow-lg mb-2 uppercase">
          {mode === 'classic' ? 'Classic Mode' : 'Franchise Mode'}
        </div>
        <div className="text-[var(--text-muted)] text-sm font-bold tracking-widest uppercase mb-8">
          Configure Settings
        </div>

        <div className="card p-6 border border-[var(--card-border)] flex flex-col space-y-6 shadow-xl shadow-black/50 text-left">
          <h3 className="font-bold text-[var(--text-muted)] uppercase tracking-widest text-sm mb-2 border-b border-[var(--card-border)] pb-2 flex items-center gap-2">
            <Target size={16} className="text-blue-500" /> Simulation Settings
          </h3>
          
          <div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-2 font-bold">Difficulty</div>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'normal', 'hard'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => setSettings({ ...settings, difficulty: d })}
                  className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                    settings.difficulty === d
                      ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                      : 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-muted)] hover:border-gray-600 hover:text-[var(--text-muted)]'
                  }`}
                >
                  <div className="capitalize">{d}</div>
                  <div className="text-[9px] font-normal opacity-70 mt-0.5">
                    {d === 'easy' ? '3 rerolls' : d === 'normal' ? '1 reroll' : 'No rerolls'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-2 font-bold">Show Ratings</div>
              <div className="flex flex-col gap-2">
                {(['on', 'off'] as ShowRatings[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setSettings({ ...settings, showRatings: r })}
                    className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                      settings.showRatings === r
                        ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                        : 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-muted)] hover:border-gray-600 hover:text-[var(--text-muted)]'
                    }`}
                  >
                    <div className="capitalize">{r}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-2 font-bold">Simulation Speed</div>
              <div className="flex flex-col gap-2">
                {(['fast', 'full'] as SimSpeed[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setSettings({ ...settings, simSpeed: s })}
                    className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                      settings.simSpeed === s
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-muted)] hover:border-gray-600 hover:text-[var(--text-muted)]'
                    }`}
                  >
                    <div className="capitalize">{s === 'fast' ? 'Fast' : 'Watch'}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-4 mt-8">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStart}
            className="btn-primary text-2xl font-black px-16 py-4 pulse-gold w-full uppercase tracking-widest shadow-2xl"
          >
            START DRAFT
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Gamble Draft Screen ──────────────────────────────────────────────
function GambleDraftScreen({
  playersPool,
  onComplete
}: {
  playersPool: Player[];
  onComplete: (squad: SquadSlot[]) => void;
}) {
  const [draftState, setDraftState] = useState<'init' | 'philosophy' | 'drafting' | 'reveal'>('init');
  const [gambleResult, setGambleResult] = useState<GambleResult | null>(null);
  const [revealedPlayers, setRevealedPlayers] = useState<Player[]>([]);

  useEffect(() => {
    // Phase 1: Generating Team...
    setTimeout(() => {
      const result = generateGambleTeam(playersPool);
      setGambleResult(result);
      setDraftState('philosophy');
    }, 1500);
  }, [playersPool]);

  useEffect(() => {
    if (draftState === 'philosophy' && gambleResult) {
      setTimeout(() => setDraftState('drafting'), 2000);
    }
  }, [draftState, gambleResult]);

  useEffect(() => {
    if (draftState === 'drafting' && gambleResult) {
      let i = 0;
      const interval = setInterval(() => {
        if (i < gambleResult.squad.length) {
          const p = gambleResult.squad[i].player;
          if (p) {
            setRevealedPlayers(prev => [...prev, p]);
          }
          i++;
        } else {
          clearInterval(interval);
          setTimeout(() => setDraftState('reveal'), 1000);
        }
      }, 600); // 600ms per player reveal
      return () => clearInterval(interval);
    }
  }, [draftState, gambleResult]);

  if (draftState === 'init') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-canvas-soft)]">
        <div className="text-sm font-mono text-[var(--color-mute)] animate-pulse uppercase tracking-widest">
          Generating Team...
        </div>
      </div>
    );
  }

  if (draftState === 'philosophy' && gambleResult) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-[var(--color-canvas-soft)]">
        <div className="text-[var(--color-mute)] font-mono text-xs uppercase tracking-widest">Selecting Philosophy...</div>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="text-3xl font-semibold tracking-tight text-[var(--color-ink)] flex items-center gap-4"
        >
          <span className="text-[var(--color-link)]">✓</span> {gambleResult.philosophy}
        </motion.div>
        {gambleResult.specialEvent !== 'NONE' && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 px-3 py-1.5 bg-[var(--color-canvas)] text-[var(--color-ink)] rounded-full text-xs font-mono border border-[var(--color-hairline)] [box-shadow:var(--shadow-vercel-2)]"
          >
            SPECIAL EVENT: {gambleResult.specialEvent}
          </motion.div>
        )}
      </div>
    );
  }

  if (draftState === 'drafting' && gambleResult) {
    return (
      <div className="min-h-screen flex flex-col items-center pt-24 px-4 pb-24 bg-gradient-to-b from-[var(--color-canvas)] to-[var(--color-canvas-soft)] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
           <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-primary)] opacity-5 rounded-full blur-3xl mix-blend-multiply" />
           <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 opacity-5 rounded-full blur-3xl mix-blend-multiply" />
        </div>
        <div className="text-[var(--color-mute)] font-mono text-xs uppercase tracking-widest mb-12 z-10 font-bold bg-[var(--color-canvas-soft-2)] px-4 py-2 rounded-full border border-[var(--color-hairline)] shadow-sm">Drafting Players...</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl z-10">
          <AnimatePresence>
            {revealedPlayers.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-canvas)]/80 backdrop-blur-md border border-[var(--color-hairline)] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] relative overflow-hidden group hover:border-[var(--color-primary)]/50 transition-colors"
              >
                {p.is_overseas && <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500/10 rounded-bl-xl flex items-center justify-center text-[10px]">✈️</div>}
                
                <div className="w-12 h-12 flex items-center justify-center font-mono font-bold text-lg rounded-full bg-[var(--color-canvas-soft-2)] text-[var(--color-ink)] border-2 border-[var(--color-hairline)] shadow-inner">
                  {p.overall}
                </div>
                
                <div className="flex flex-col flex-1 min-w-0 pr-6">
                  <span className="font-bold text-base tracking-tight text-[var(--color-ink)] truncate group-hover:text-[var(--color-primary)] transition-colors">{p.name}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-[var(--color-mute)] font-mono font-bold uppercase bg-[var(--color-canvas-soft-2)] px-1.5 py-0.5 rounded">{p.role}</span>
                    <span className="text-[10px] text-[var(--color-mute)] truncate">{p.team}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (draftState === 'reveal' && gambleResult) {
    const strength = calcSquadStrength(gambleResult.squad);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-[var(--color-canvas-soft)] to-[var(--color-canvas)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-4xl bg-[var(--color-canvas)]/90 backdrop-blur-xl p-8 md:p-12 rounded-3xl border border-[var(--color-hairline)] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.15)] relative overflow-hidden"
        >
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-primary)] opacity-5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="text-center mb-12 relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-5xl font-black tracking-tighter text-[var(--color-ink)] mb-6 drop-shadow-sm"
            >
              Your Gamble Team
            </motion.h1>
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-[var(--color-canvas-soft)]/80 backdrop-blur border border-[var(--color-hairline)] text-[var(--color-ink)] rounded-full font-mono text-xs shadow-sm font-bold">
              <span className="text-[var(--color-primary)]">TEAM TYPE</span> {gambleResult.philosophy}
            </div>
            {gambleResult.specialEvent !== 'NONE' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                className="mt-6 text-[var(--color-warning)] font-mono text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 bg-[var(--color-warning)]/10 py-2 px-4 rounded-lg inline-flex w-auto mx-auto border border-[var(--color-warning)]/20"
              >
                <Zap size={16} /> {gambleResult.specialEvent} <Zap size={16} />
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
            <div className="bg-[var(--color-canvas-soft-2)]/50 backdrop-blur p-6 rounded-2xl border border-[var(--color-hairline)] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-[var(--color-mute)] text-xs font-mono uppercase tracking-widest font-bold mb-4">
                <Target size={16} /> Projected Record
              </div>
              <div className="text-5xl font-black tracking-tighter text-[var(--color-ink)]">{gambleResult.projectedRecord}</div>
            </div>
            
            <div className="bg-[var(--color-canvas-soft-2)]/50 backdrop-blur p-6 rounded-2xl border border-[var(--color-hairline)] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center">
              <div className="flex items-center gap-2 text-[var(--color-mute)] text-xs font-mono uppercase tracking-widest font-bold mb-4">
                <Trophy size={16} /> Team Strength
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--color-body)] font-bold">Batting</span> 
                  <span className="font-mono text-base font-bold bg-[var(--color-canvas)] px-3 py-1 rounded-lg border border-[var(--color-hairline)]">{strength.batting}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--color-body)] font-bold">Bowling</span> 
                  <span className="font-mono text-base font-bold bg-[var(--color-canvas)] px-3 py-1 rounded-lg border border-[var(--color-hairline)]">{strength.bowling}</span>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-[var(--color-hairline)]">
                  <span className="text-[var(--color-ink)] font-black text-lg">Overall Rating</span> 
                  <span className="font-mono font-black text-2xl text-[var(--color-primary)] drop-shadow-md">{strength.overall}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 relative z-10">
            <div className="bg-[var(--color-success)]/5 p-6 rounded-2xl border border-[var(--color-success)]/20 shadow-inner">
              <div className="text-[var(--color-success)] font-mono text-sm font-bold uppercase tracking-widest mb-5 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[var(--color-success)]/20 flex items-center justify-center">✓</div>
                Strengths
              </div>
              <ul className="text-[var(--color-ink)] text-sm space-y-3 font-medium">
                {gambleResult.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[var(--color-success)] mt-0.5">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-[var(--color-error)]/5 p-6 rounded-2xl border border-[var(--color-error)]/20 shadow-inner">
              <div className="text-[var(--color-error)] font-mono text-sm font-bold uppercase tracking-widest mb-5 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[var(--color-error)]/20 flex items-center justify-center">✗</div>
                Weaknesses
              </div>
              <ul className="text-[var(--color-ink)] text-sm space-y-3 font-medium">
                {gambleResult.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[var(--color-error)] mt-0.5">•</span> {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onComplete(gambleResult.squad)}
            className="w-full relative overflow-hidden rounded-2xl p-[2px] z-10 group shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)] via-yellow-400 to-[var(--color-primary)] animate-shimmer bg-[length:200%_100%]" />
            <div className="relative bg-[var(--color-canvas)] py-4 rounded-[14px] flex items-center justify-center gap-3 transition-colors group-hover:bg-transparent">
               <span className="font-bold text-lg text-[var(--color-ink)] group-hover:text-black transition-colors tracking-tight">Accept Fate & Start Season</span>
               <Play size={20} className="text-[var(--color-primary)] group-hover:text-black transition-colors" />
            </div>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return null;
}

// ─── Draft Screen ─────────────────────────────────────────────
function DraftScreen({
  players,
  squad,
  onPickPlayer,
  onSwapPlayers,
  rerolls,
  onReroll,
  pickedNames,
  settings,
  playerForms,
  onFinishDraft,
}: {
  players: Player[];
  squad: SquadSlot[];
  onPickPlayer: (p: Player, slotIdx: number) => void;
  onSwapPlayers: (idx1: number, idx2: number) => void;
  rerolls: number;
  onReroll: () => void;
  pickedNames: Set<string>;
  settings: GameSettings;
  playerForms: Record<number, PlayerForm>;
  onFinishDraft?: () => void;
}) {
  const [currentSpin, setCurrentSpin] = useState<{ team: string; season: number; players: Player[] } | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [selectedSlotForMove, setSelectedSlotForMove] = useState<number | null>(null);
  const [spinDisplay, setSpinDisplay] = useState({ team: '', season: 0 });
  const [playerForRoleSelection, setPlayerForRoleSelection] = useState<{player: Player, availableRoles: Role[]} | null>(null);
  const spinCount = useRef(0);

  const strength = calcSquadStrength(squad);
  const filledCount = squad.filter(s => s.player !== null).length;
  const maxPlayers = settings.mode === 'franchise' ? 25 : 11;
  const maxOverseas = settings.mode === 'franchise' ? 8 : 4;

  // Get unique team/season combos from players data
  const teamSeasons = useCallback(() => {
    const combos = new Map<string, Player[]>();
    players.forEach(p => {
      const key = `${p.team}|||${p.season}`;
      if (!combos.has(key)) combos.set(key, []);
      combos.get(key)!.push(p);
    });
    return Array.from(combos.entries()).map(([key, ps]) => {
      const [team, season] = key.split('|||');
      return { team, season: parseInt(season), players: ps };
    });
  }, [players]);

  const doSpin = useCallback(() => {
    if (isSpinning) return;
    setIsSpinning(true);
    setCurrentSpin(null);

    const combos = teamSeasons();
    const allTeams = Array.from(new Set(combos.map(c => c.team)));
    
    const finalTeam = allTeams[Math.floor(Math.random() * allTeams.length)];
    const finalTeamCombos = combos.filter(c => c.team === finalTeam);
    const final = finalTeamCombos[Math.floor(Math.random() * finalTeamCombos.length)];
    
    let spinIdx = 0;
    const maxSpins = 40; 
    
    const tick = () => {
      const randomTeam = allTeams[Math.floor(Math.random() * allTeams.length)];
      const teamCombos = combos.filter(c => c.team === randomTeam);
      const random = teamCombos[Math.floor(Math.random() * teamCombos.length)];
      
      setSpinDisplay({ team: random.team, season: random.season });
      spinIdx++;
      
      if (spinIdx >= maxSpins) {
        setSpinDisplay({ team: final.team, season: final.season });
        
        const spinPlayers = [...final.players];
        if (settings.showRatings === 'off') {
          spinPlayers.sort(() => Math.random() - 0.5);
        } else {
          spinPlayers.sort((a, b) => b.overall - a.overall);
        }
        
        setCurrentSpin({ team: final.team, season: final.season, players: spinPlayers });
        setIsSpinning(false);
        spinCount.current++;
      } else {
        const progress = spinIdx / maxSpins;
        const nextInterval = 20 + Math.pow(progress, 3) * 400; 
        setTimeout(tick, nextInterval);
      }
    };
    
    tick();
  }, [isSpinning, teamSeasons, settings.showRatings]);

  const getBaseQuotaRole = (r: Role): 'WK' | 'BAT' | 'AR' | 'BOWL' => {
    if (r === 'BAT_AR' || r === 'BOWL_AR') return 'AR';
    return r as 'WK' | 'BAT' | 'AR' | 'BOWL';
  };

  // Global quotas
  const ROLE_QUOTAS: Record<'WK' | 'BAT' | 'AR' | 'BOWL', number> = { WK: 1, BAT: 4, AR: 2, BOWL: 4 };
  const FRANCHISE_MAX_QUOTAS: Record<'WK' | 'BAT' | 'AR' | 'BOWL', number> = { WK: 3, BAT: 8, AR: 5, BOWL: 9 };

  const isRoleNeeded = (role: Role) => {
    const quotaRole = getBaseQuotaRole(role);
    const count = squad.filter(s => s.player && getBaseQuotaRole(s.player.role) === quotaRole).length;
    if (settings.mode === 'franchise') {
      return count < FRANCHISE_MAX_QUOTAS[quotaRole];
    }
    return count < ROLE_QUOTAS[quotaRole];
  };

  const handlePickPlayer = (p: Player) => {
    const allowed = p.allowedRoles && p.allowedRoles.length > 0 ? p.allowedRoles : [p.role];
    const availableRoles = allowed.filter(r => isRoleNeeded(r));
    
    if (availableRoles.length === 0) return;

    if (availableRoles.length === 1) {
      assignPlayerRole(p, availableRoles[0]);
    } else {
      setPlayerForRoleSelection({ player: p, availableRoles });
    }
  };

  const assignPlayerRole = (p: Player, chosenRole: Role) => {
    const draftedPlayer = { ...p, role: chosenRole };
    
    // Find empty slots
    const emptySlots = squad.map((s, i) => ({ s, i })).filter(({ s }) => s.player === null);
    if (emptySlots.length === 0) return;

    let targetIdx = emptySlots[0].i;

    if (settings.mode !== 'franchise') {
        const quotaRole = getBaseQuotaRole(chosenRole);
        const wkSlot = emptySlots.find(({ s }) => s.position === 'WK');
        if (quotaRole === 'WK' && wkSlot) targetIdx = wkSlot.i;
        else if (quotaRole === 'BOWL' || quotaRole === 'AR') {
            const bowlerSlot = emptySlots.find(({ s }) => s.position === 'BOWLER');
            if (bowlerSlot) targetIdx = bowlerSlot.i;
        }
    }

    onPickPlayer(draftedPlayer, targetIdx);
    setCurrentSpin(null);
  };

  const handleSlotClick = (idx: number) => {
    if (!moveMode) return;
    
    if (selectedSlotForMove === null) {
      if (squad[idx].player) {
        setSelectedSlotForMove(idx);
      }
    } else {
      const p1 = squad[selectedSlotForMove].player!;
      const p2 = squad[idx].player;
      
      const p1Quota = getBaseQuotaRole(p1.role);
      const p2Quota = p2 ? getBaseQuotaRole(p2.role) : null;

      // Constraints
      if (settings.mode !== 'franchise') {
          if (squad[idx].position === 'WK' && p1Quota !== 'WK') {
            setSelectedSlotForMove(null);
            return;
          }
          if (squad[selectedSlotForMove].position === 'WK' && p2 && p2Quota !== 'WK') {
            setSelectedSlotForMove(null);
            return;
          }
          if (squad[idx].position === 'BOWLER' && p1Quota !== 'BOWL' && p1Quota !== 'AR') {
            setSelectedSlotForMove(null);
            return;
          }
          if (squad[selectedSlotForMove].position === 'BOWLER' && p2 && p2Quota !== 'BOWL' && p2Quota !== 'AR') {
            setSelectedSlotForMove(null);
            return;
          }
      }

      if (selectedSlotForMove !== idx) {
        onSwapPlayers(selectedSlotForMove, idx);
      }
      setSelectedSlotForMove(null);
    }
  };

  const overseasCount = squad.filter(s => s.player?.is_overseas).length;

  const isPlayerDisabled = (p: Player) => {
    const allowed = p.allowedRoles && p.allowedRoles.length > 0 ? p.allowedRoles : [p.role];
    const roleFull = allowed.every(r => !isRoleNeeded(r));
    const alreadyPicked = pickedNames.has(p.name.toLowerCase().trim());
    const overseasLimit = p.is_overseas && overseasCount >= maxOverseas;
    const rosterFull = filledCount >= maxPlayers;
    return roleFull || alreadyPicked || overseasLimit || rosterFull;
  };

  const disabledReason = (p: Player): string | null => {
    if (pickedNames.has(p.name.toLowerCase().trim())) return 'Already in XI';
    if (p.is_overseas && overseasCount >= maxOverseas) return `Max ${maxOverseas} Overseas`;
    const allowed = p.allowedRoles && p.allowedRoles.length > 0 ? p.allowedRoles : [p.role];
    if (allowed.every(r => !isRoleNeeded(r))) return 'Role Full';
    if (filledCount >= maxPlayers) return 'Roster Full';
    return null;
  };

  const draftedPlayers = squad.filter(s => s.player).map(s => s.player!);
  const wkCount = draftedPlayers.filter(p => p.role === 'WK').length;
  const batCount = draftedPlayers.filter(p => p.role === 'BAT').length;
  const arCount = draftedPlayers.filter(p => p.role === 'AR' || p.role === 'BAT_AR' || p.role === 'BOWL_AR').length;
  const bwlCount = draftedPlayers.filter(p => p.role === 'BOWL').length;
  const meetsFranchiseRules = wkCount >= 2 && batCount >= 5 && arCount >= 3 && bwlCount >= 6;

  return (
    <div className="min-h-screen flex flex-col max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-[var(--color-hairline)] pb-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-ink)] flex items-center gap-3">
            <Swords className="text-yellow-500" size={28} />
            {settings.mode === 'franchise' ? 'Franchise Draft' : 'Draft Your XI'}
          </h2>
          <p className="text-sm text-[var(--color-mute)] mt-1 font-medium">
            {settings.mode === 'franchise' 
              ? `Select 18-25 players. Max ${maxOverseas} overseas.` 
              : 'Select 11 players to build your ultimate squad. Max 4 overseas.'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {settings.mode === 'franchise' && (
             <button
              onClick={onFinishDraft}
              disabled={filledCount < 18 || !meetsFranchiseRules}
              className={`px-6 py-2 rounded-xl font-bold shadow-lg transition-colors ${
                (filledCount >= 18 && meetsFranchiseRules) 
                  ? 'bg-green-500 text-black hover:bg-green-400 animate-pulse'
                  : 'bg-[var(--color-canvas)] text-[var(--color-mute)] cursor-not-allowed border border-[var(--color-hairline)]'
              }`}
             >
               {filledCount < 18 
                 ? `Draft ${18 - filledCount} More` 
                 : !meetsFranchiseRules 
                   ? 'Rules Not Met' 
                   : 'Finish Draft'}
             </button>
          )}
        </div>
      </div>

      <div className="flex gap-6 relative flex-grow">
      {playerForRoleSelection && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--color-primary)]/80 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <RatingBadge rating={playerForRoleSelection.player.overall} hidden={settings.showRatings === 'off'} size="lg" />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-ink)] mt-3">{playerForRoleSelection.player.name}</h3>
              <p className="text-sm text-[var(--color-mute)] mt-1">Select Role</p>
            </div>
            <div className="flex flex-col gap-3">
              {playerForRoleSelection.availableRoles.map(r => (
                <button
                  key={r}
                  onClick={() => {
                    assignPlayerRole(playerForRoleSelection.player, r);
                    setPlayerForRoleSelection(null);
                  }}
                  className="bg-[var(--color-canvas)] border border-[var(--color-hairline)] hover:border-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400 text-[var(--color-ink)] py-3 rounded-xl font-bold transition-all"
                >
                  {r === 'BAT_AR' ? 'Batting All-Rounder' :
                   r === 'BOWL_AR' ? 'Bowling All-Rounder' :
                   r === 'AR' ? 'Genuine All-Rounder' :
                   r === 'BAT' ? 'Pure Batter' :
                   r === 'WK' ? 'Wicketkeeper' :
                   r === 'BOWL' ? 'Pure Bowler' : r}
                </button>
              ))}
            </div>
            <button onClick={() => setPlayerForRoleSelection(null)} className="mt-4 w-full text-center text-sm font-bold text-[var(--color-mute)] hover:text-[var(--color-mute)] py-2">
              Cancel
            </button>
          </motion.div>
        </div>
      )}
      {/* Left: Pitch & Squad */}
      <div className="w-[340px] flex-shrink-0 flex flex-col gap-4">
        {/* Top Badges */}
        <div className="flex items-center justify-between bg-[var(--color-canvas)] p-3 rounded-xl border border-[var(--color-hairline)]">
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-mute)] text-[10px] font-mono uppercase font-bold tracking-wider">Players</span>
            <span className="text-[var(--color-ink)] font-bold text-xs bg-[var(--color-canvas)] px-2 py-0.5 rounded-md">{filledCount}/{maxPlayers}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-mute)] text-[10px] font-mono uppercase font-bold tracking-wider">Overseas</span>
            <span className={`font-bold text-xs px-2 py-0.5 rounded-md ${overseasCount >= maxOverseas ? 'bg-red-900/50 text-red-400' : 'bg-[var(--color-canvas)] text-[var(--color-ink)]'}`}>{overseasCount}/{maxOverseas}</span>
          </div>
        </div>

        <WheelLayout 
          squad={squad.filter(s => s.position !== 'BENCH')} 
          onSlotClick={(idx) => moveMode ? handleSlotClick(idx) : setSelectedSlotForMove(idx === selectedSlotForMove ? null : idx)} 
          settings={settings} 
          selectedSlot={selectedSlotForMove}
        />
        {settings.mode === 'franchise' && (
          <BenchLayout 
            squad={squad} 
            onSlotClick={(idx) => moveMode ? handleSlotClick(idx) : setSelectedSlotForMove(idx === selectedSlotForMove ? null : idx)} 
            settings={settings} 
            selectedSlot={selectedSlotForMove} 
          />
        )}
        <div className="flex flex-col items-center">
          <button
            onClick={() => {
              setMoveMode(!moveMode);
              setSelectedSlotForMove(null);
            }}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-colors border ${
              moveMode 
                ? 'bg-[var(--color-ink)] text-[var(--color-canvas)] border-[var(--color-ink)]'
                : 'bg-[var(--color-canvas)] text-[var(--color-ink)] border-[var(--color-hairline)] hover:bg-green-800/50'
            }`}
          >
            {moveMode ? '↔ Done moving' : '↔ Move a player'}
          </button>
          {moveMode ? (
            <div className="mt-2 text-[10px] text-[var(--color-mute)] text-center leading-relaxed">
              <strong className="text-[var(--color-mute)]">Tap a player on the pitch</strong> to pick them up, then tap a slot.<br/>
              Empty slot = they move there • Team-mate = swap.
            </div>
          ) : (
            <div className="mt-2 text-[10px] text-[var(--color-mute)] text-center">
              Reposition a drafted player to open up a slot.
            </div>
          )}
        </div>

        {/* Strength bars */}
        {filledCount > 0 && settings.showRatings === 'on' && (
          <div className="card p-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--color-mute)]">Batting</span>
              <span className="font-bold text-[var(--color-ink)]">{strength.batting}</span>
            </div>
            <ProgressBar value={strength.batting} color="#22c55e" />
            <div className="flex justify-between text-xs">
              <span className="text-[var(--color-mute)]">Bowling</span>
              <span className="font-bold text-[var(--color-ink)]">{strength.bowling}</span>
            </div>
            <ProgressBar value={strength.bowling} color="#3b82f6" />
            <div className="flex justify-between text-xs mt-1">
              <span className="text-[var(--color-mute)] font-semibold">Effective Overall</span>
              <span className="font-bold text-yellow-400">{strength.overall}</span>
            </div>
          </div>
        )}
        {filledCount > 0 && settings.showRatings === 'off' && (
          <div className="card p-3 space-y-2 flex items-center justify-center text-center opacity-50 py-8">
            <div className="text-xs text-[var(--color-mute)] uppercase tracking-widest">Ratings Hidden</div>
          </div>
        )}
      </div>

      {/* Middle: Draft Area */}
      <div className="flex-1 flex flex-col gap-4 min-w-[300px]">
        {/* Header */}
        <div className="flex items-center justify-between bg-[var(--color-canvas)] p-3 rounded-xl border border-[var(--color-hairline)]">
          <div className="text-xs font-bold text-[var(--color-mute)] uppercase tracking-widest">Draft Option</div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-mute)] text-[10px] font-mono uppercase font-bold tracking-wider">Rerolls</span>
            <span className="text-yellow-400 font-bold text-xs bg-yellow-400/10 px-2 py-0.5 rounded-md">{rerolls} left</span>
          </div>
        </div>

        {settings.mode === 'franchise' && (
          <div className="bg-[var(--color-canvas)] p-3 rounded-xl border border-[var(--color-hairline)] flex flex-col gap-2">
            <div className="text-[10px] font-bold text-[var(--color-mute)] uppercase tracking-widest text-center">Franchise Squad Rules</div>
            <div className="flex justify-between items-center gap-1 bg-[var(--color-canvas-soft-2)] p-2 rounded-lg">
              <div className="flex flex-col items-center flex-1">
                <span className="text-[var(--color-mute)] text-[9px] uppercase font-bold">WK (2+)</span>
                <span className={`text-xs font-semibold tracking-tight ${wkCount < 2 ? 'text-red-400' : 'text-green-400'}`}>{wkCount}</span>
              </div>
              <div className="flex flex-col items-center flex-1 border-l border-[var(--color-hairline)]">
                <span className="text-[var(--color-mute)] text-[9px] uppercase font-bold">BAT (5+)</span>
                <span className={`text-xs font-semibold tracking-tight ${batCount < 5 ? 'text-red-400' : 'text-green-400'}`}>{batCount}</span>
              </div>
              <div className="flex flex-col items-center flex-1 border-l border-[var(--color-hairline)]">
                <span className="text-[var(--color-mute)] text-[9px] uppercase font-bold">AR (3+)</span>
                <span className={`text-xs font-semibold tracking-tight ${arCount < 3 ? 'text-red-400' : 'text-green-400'}`}>{arCount}</span>
              </div>
              <div className="flex flex-col items-center flex-1 border-l border-[var(--color-hairline)]">
                <span className="text-[var(--color-mute)] text-[9px] uppercase font-bold">BWL (6+)</span>
                <span className={`text-xs font-semibold tracking-tight ${bwlCount < 6 ? 'text-red-400' : 'text-green-400'}`}>{bwlCount}</span>
              </div>
            </div>
            <div className="text-[9px] text-[var(--color-mute)] text-center font-semibold mt-1">
              Min 18 total. Recommended Ideal: WK 2-3 | BAT 6-8 | AR 4-5 | BWL 8-9
            </div>
          </div>
        )}

        {/* Global Spin Button */}
        <motion.button
          whileHover={{ scale: ((currentSpin && rerolls === 0) || isSpinning) ? 1 : 1.02 }}
          whileTap={{ scale: ((currentSpin && rerolls === 0) || isSpinning) ? 1 : 0.98 }}
          onClick={() => {
            if (isSpinning || (currentSpin && rerolls === 0)) return;
            if (currentSpin) onReroll();
            doSpin();
          }}
          disabled={(currentSpin && rerolls === 0) || isSpinning}
          className={`w-full text-lg py-4 font-semibold tracking-tight rounded-xl transition-all flex items-center justify-center gap-2 ${
            isSpinning 
              ? 'bg-[var(--color-warning-soft)] text-[var(--color-warning-deep)] cursor-wait' 
              : (currentSpin && rerolls === 0)
                ? 'bg-[var(--color-canvas)] text-[var(--color-mute)] cursor-not-allowed'
                : 'btn-primary pulse-gold'
          }`}
        >
          🎰 {isSpinning ? 'SPINNING...' : currentSpin ? `REROLL SQUAD (${rerolls} LEFT)` : 'SPIN TO REVEAL'}
        </motion.button>

        {!currentSpin && !isSpinning ? (
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[var(--color-hairline)] rounded-2xl bg-[var(--color-canvas-soft-2)] p-8">
            <div className="text-2xl font-semibold tracking-tight text-[var(--color-mute)] mb-2">Ready to Draft</div>
            <div className="text-sm text-gray-600 text-center max-w-sm">
              Spin to reveal a random IPL squad and season. Draft one player to your starting XI.
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Spin Info */}
            <div className={`p-8 rounded-2xl border flex flex-col items-center justify-center min-h-[160px] transition-all duration-500 relative overflow-hidden ${isSpinning ? 'border-yellow-500/50 bg-[var(--color-canvas-soft-2)] [box-shadow:var(--shadow-vercel-3)]' : 'border-[var(--color-hairline)] bg-[var(--color-canvas)]'}`}>
              {isSpinning && (
                <motion.div 
                  className="absolute inset-0 bg-yellow-500/5"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.2, repeat: Infinity }}
                />
              )}
              <div className="text-[10px] font-mono text-[var(--color-mute)] uppercase tracking-widest font-bold mb-4 z-10">{isSpinning ? 'Spinning...' : 'Revealed Squad'}</div>
              <div className="flex flex-col items-center gap-3 z-10">
                <motion.div
                  key={spinDisplay.team + spinDisplay.season}
                  initial={isSpinning ? { y: -20, opacity: 0, scale: 0.8 } : false}
                  animate={isSpinning ? { y: 0, opacity: 1, scale: 1.1 } : { scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="px-6 py-2 rounded-xl text-3xl font-semibold tracking-tight shadow-2xl border border-[var(--color-hairline)]"
                  style={{ background: teamColor(spinDisplay.team), color: '#fff' }}
                >
                  {spinDisplay.team || '—'} {spinDisplay.season || ''}
                </motion.div>
              </div>
            </div>

            {/* Players Grid */}
            {!isSpinning && currentSpin && (
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="text-[10px] font-mono text-[var(--color-mute)] uppercase tracking-widest mb-3 font-bold px-1">Select one player for your XI</div>
                <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-2 custom-scrollbar pb-6">
                  {currentSpin.players.slice().sort((a, b) => {
                  const aDisabled = isPlayerDisabled(a);
                  const bDisabled = isPlayerDisabled(b);
                  if (aDisabled && !bDisabled) return 1;
                  if (!aDisabled && bDisabled) return -1;
                  return 0;
                }).map((p, i) => {
                  const disabled = isPlayerDisabled(p);
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      whileHover={!disabled ? { y: -2 } : {}}
                      onClick={() => !disabled && handlePickPlayer(p)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        disabled
                          ? 'opacity-40 cursor-not-allowed border-[var(--color-hairline)] bg-[var(--color-canvas-soft-2)] opacity-50'
                          : 'cursor-pointer border-[var(--color-hairline)] bg-[var(--color-canvas)] hover:border-yellow-500/50 hover:bg-yellow-500/5 shadow-sm'
                      }`}
                    >
                      <RatingBadge rating={p.overall} hidden={settings.showRatings === 'off'} />
                      <div className="flex-1 min-w-0">
                         <div className="font-semibold text-sm text-[var(--color-ink)] truncate">
                          {p.name} {p.is_overseas && <span title="Overseas Player">✈️</span>}
                        </div>
                        <div className="text-[10px] text-[var(--color-mute)] mt-0.5">{p.role} · {p.team} {p.season}</div>
                        {disabled && (
                          <div className={`text-[10px] font-bold mt-1 ${
                            pickedNames.has(p.name.toLowerCase().trim())
                              ? 'text-yellow-600'
                              : 'text-gray-600'
                          }`}>
                            {disabledReason(p)}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Selected Player Detail */}
      <div className="w-[340px] flex-shrink-0 flex flex-col gap-4">
        {selectedSlotForMove !== null && squad[selectedSlotForMove]?.player ? (
          <div className="card p-6 flex flex-col gap-4 relative overflow-hidden shadow-2xl border border-[var(--color-hairline)]">
             {squad[selectedSlotForMove].player!.is_overseas && (
               <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
             )}
             <div className="flex justify-between items-start z-10">
               <div>
                 <div className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
                   {squad[selectedSlotForMove].player!.name}
                   {squad[selectedSlotForMove].player!.is_overseas && <span className="ml-2" title="Overseas Player">✈️</span>}
                 </div>
                 <div className="text-sm font-bold text-[var(--color-mute)] mt-1 uppercase tracking-widest">
                   {squad[selectedSlotForMove].player!.team} • {squad[selectedSlotForMove].player!.season}
                 </div>
               </div>
               <RatingBadge rating={squad[selectedSlotForMove].player!.overall} size="lg" hidden={settings.showRatings === 'off'} />
             </div>
             
             <div className="flex gap-4 mt-4 pt-4 border-t border-[var(--color-hairline)] z-10">
               <div className="flex-1">
                 <div className="text-[10px] font-mono text-[var(--color-mute)] uppercase tracking-widest font-bold">Role</div>
                 <div className="text-sm font-bold text-[var(--color-ink)]">{squad[selectedSlotForMove].player!.role}</div>
               </div>
               <div className="flex-1 border-l border-[var(--color-hairline)] pl-4">
                 <div className="text-[10px] font-mono text-[var(--color-mute)] uppercase tracking-widest font-bold">Position</div>
                 <div className="text-sm font-bold text-[var(--color-ink)]">{squad[selectedSlotForMove].position}</div>
               </div>
             </div>
             
             {playerForms && playerForms[squad[selectedSlotForMove].player!.id] && (
               <div className="z-10 mt-2">
                 <PlayerFormInline form={playerForms[squad[selectedSlotForMove].player!.id]} />
               </div>
             )}
          </div>
        ) : (
          <div className="card p-6 flex flex-col items-center justify-center text-center opacity-50 min-h-[300px]">
            <div className="text-sm text-[var(--color-mute)]">Select a drafted player on the wheel to view details.</div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

// ——— Squad Complete Screen ————————————————————————————————————————
function SquadCompleteScreen({
  squad,
  onSimulate,
  onRestart,
  settings,
  playerForms,
}: {
  squad: SquadSlot[];
  onSimulate: (control: 'full' | 'ai') => void;
  onRestart: () => void;
  settings: GameSettings;
  playerForms: Record<number, PlayerForm>;
}) {
  const [localControl, setLocalControl] = useState<'full' | 'ai'>('ai');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const strength = calcSquadStrength(squad);
  const odds = calcOdds(strength.overall);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-canvas)] to-[var(--color-canvas-soft-2)] p-4 md:p-8">
      <div className="max-w-[1600px] w-full flex flex-col lg:flex-row gap-6 bg-[var(--color-canvas)]/60 backdrop-blur-3xl rounded-[2rem] border border-[var(--color-hairline)] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] p-6 md:p-8 relative overflow-hidden">
        
        {/* Subtle background effects */}
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-[var(--color-primary)] opacity-5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
        
        {/* Left: Wheel */}
        <div className="w-full lg:w-[380px] flex-shrink-0 flex flex-col gap-6 z-10">
          <div className="flex items-center gap-3 bg-[var(--color-success)]/10 text-[var(--color-success)] px-4 py-2 rounded-full w-max border border-[var(--color-success)]/20 shadow-sm">
            <span className="font-bold text-sm tracking-tight">Squad Complete</span>
            <div className="w-5 h-5 rounded-full bg-[var(--color-success)] flex items-center justify-center text-[var(--color-canvas)] text-xs">✓</div>
          </div>
          
          <WheelLayout 
            squad={squad.filter(s => s.position !== 'BENCH')} 
            onSlotClick={setSelectedSlot} 
            selectedSlot={selectedSlot} 
            settings={settings} 
          />
          
          {settings.mode === 'franchise' && (
            <BenchLayout 
              squad={squad} 
              onSlotClick={setSelectedSlot} 
              settings={settings} 
              selectedSlot={selectedSlot} 
            />
          )}
          
          <div className="bg-[var(--color-canvas)] p-5 rounded-2xl border border-[var(--color-hairline)] shadow-sm space-y-4">
            {settings.showRatings === 'on' ? (
              <>
                {[
                  { label: 'Batting', val: strength.batting, color: '#22c55e' },
                  { label: 'Bowling', val: strength.bowling, color: '#3b82f6' },
                ].map(({ label, val, color }) => (
                  <div key={label}>
                    <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                      <span className="text-[var(--color-mute)] uppercase tracking-wider">{label}</span>
                      <span className="text-[var(--color-ink)]">{val}</span>
                    </div>
                    <ProgressBar value={val} color={color} />
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 mt-1 border-t border-[var(--color-hairline)]">
                  <span className="text-xs font-bold text-[var(--color-mute)] uppercase tracking-wider">Effective Overall</span>
                  <span className="text-2xl font-black tracking-tight text-[var(--color-primary)]">{strength.overall}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center text-center py-10 opacity-60">
                <div className="text-xs font-mono font-bold text-[var(--color-mute)] uppercase tracking-widest flex items-center gap-2">
                  <span className="text-lg">👁️</span> Ratings Hidden
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle: Player Form */}
        <div className="w-full lg:w-[440px] flex-shrink-0 flex flex-col z-10 h-[calc(100vh-10rem)] max-h-[850px]">
          <div className="text-xl font-bold tracking-tight text-[var(--color-ink)] mb-4 flex items-center gap-2">
            Player Form
          </div>
          
          {selectedSlot !== null && squad[selectedSlot]?.player ? (
            <div className="bg-[var(--color-canvas)] p-6 rounded-2xl flex flex-col gap-5 relative overflow-hidden shadow-lg border border-[var(--color-hairline)] mb-4">
               {squad[selectedSlot].player!.is_overseas && (
                 <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
               )}
               <div className="flex justify-between items-start z-10">
                 <div className="flex flex-col gap-1">
                   <div className="text-2xl font-bold tracking-tight text-[var(--color-ink)] flex items-center">
                     {squad[selectedSlot].player!.name}
                     {squad[selectedSlot].player!.is_overseas && <span className="ml-2 text-sm" title="Overseas Player">✈️</span>}
                   </div>
                   <div className="inline-flex items-center gap-2 bg-[var(--color-canvas-soft-2)] px-2.5 py-1 rounded-md text-xs font-bold text-[var(--color-mute)] uppercase tracking-widest border border-[var(--color-hairline)] w-max">
                     {squad[selectedSlot].player!.team} • {squad[selectedSlot].player!.season}
                   </div>
                 </div>
                 <RatingBadge rating={squad[selectedSlot].player!.overall} size="lg" hidden={settings.showRatings === 'off'} />
               </div>
               
               {playerForms && playerForms[squad[selectedSlot].player!.id] && (
                 <div className="z-10 mt-1 pt-5 border-t border-[var(--color-hairline)]">
                   <PlayerFormInline form={playerForms[squad[selectedSlot].player!.id]} />
                 </div>
               )}
            </div>
          ) : (
            <div className="bg-[var(--color-canvas)] rounded-2xl border border-[var(--color-hairline)] overflow-hidden shadow-sm flex flex-col flex-1">
              <div className="p-4 bg-[var(--color-canvas-soft-2)] border-b border-[var(--color-hairline)] flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                <span className="text-xs font-bold tracking-widest uppercase text-[var(--color-mute)]">Pre-Season Form Report</span>
              </div>
              <div className="divide-y divide-[var(--color-hairline)] overflow-y-auto custom-scrollbar flex-1">
                {squad.filter(s => s.player).map((slot, idx) => {
                  const p = slot.player!;
                  const form = playerForms[p.id];
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="px-5 py-4 hover:bg-[var(--color-canvas-soft-2)] transition-colors cursor-pointer"
                      onClick={() => setSelectedSlot(squad.indexOf(slot))}
                    >
                      <div className="flex items-start gap-4">
                        <RatingBadge rating={p.overall} size="sm" hidden={settings.showRatings === 'off'} />
                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[var(--color-ink)] truncate">{p.name}</span>
                            {p.is_overseas && <span className="text-[10px] text-blue-500">✈️</span>}
                            <span className="text-[9px] bg-[var(--color-canvas)] px-1.5 py-0.5 rounded text-[var(--color-mute)] border border-[var(--color-hairline)] font-bold uppercase ml-auto shrink-0">{p.role}</span>
                          </div>
                          <PlayerFormInline form={form} compact />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right side: Predictions panel */}
        <div className="flex-1 flex flex-col z-10 min-w-[350px] lg:border-l lg:border-[var(--color-hairline)] lg:pl-8 h-[calc(100vh-10rem)] max-h-[850px]">
          <div className="flex flex-col h-full overflow-y-auto custom-scrollbar pr-2">
            <div className="text-2xl font-bold tracking-tight text-[var(--color-ink)] mb-2">Pre-Season Predictions</div>
            <div className="text-[var(--color-mute)] text-sm mb-8 leading-relaxed font-medium">Here's what the bookies make of your XI. Simulate the season and chase the impossible.</div>

            <div className="bg-[var(--color-canvas)] p-6 rounded-2xl border border-[var(--color-hairline)] shadow-sm mb-6">
              <div className="flex justify-between items-end mb-8">
                <div className="flex flex-col gap-1">
                  <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-mute)]">Projected Finish</div>
                  <div className="text-5xl font-black tracking-tighter text-[var(--color-ink)]">{odds.pos}<span className="text-2xl text-[var(--color-mute)]">{['st','nd','rd'][odds.pos-1]||'th'}</span></div>
                </div>
                <div className="text-right flex flex-col gap-1">
                  <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-mute)]">Expected Pts</div>
                  <div className="text-5xl font-black tracking-tighter text-[var(--color-primary)]">{odds.expectedPoints}</div>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Win IPL', val: odds.winIPL, color: '#f5c842' },
                  { label: 'Top 4', val: odds.top4, color: '#22c55e' },
                  { label: 'Bottom 2', val: odds.bottom2, color: '#ef4444' },
                ].map(({ label, val, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                      <span className="text-[var(--color-mute)]">{label}</span>
                      <span style={{ color }}>{val}%</span>
                    </div>
                    <ProgressBar value={val} color={color} />
                  </div>
                ))}
              </div>
            </div>

            {settings.mode === 'franchise' && (
              <div className="bg-[var(--color-canvas)] p-6 rounded-2xl border border-[var(--color-hairline)] shadow-sm mb-6 flex flex-col gap-4">
                <div className="text-xs text-[var(--color-mute)] uppercase tracking-widest font-bold">Franchise Control Mode</div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setLocalControl('ai')}
                    className={`p-4 rounded-xl text-left transition-all border-2 flex flex-col h-full ${
                      localControl === 'ai' 
                        ? 'bg-blue-500/10 border-blue-500' 
                        : 'bg-[var(--color-canvas-soft)] border-[var(--color-hairline)] hover:border-blue-500/50'
                    }`}
                  >
                    <div className="font-bold tracking-tight text-base text-[var(--color-ink)] mb-1 flex items-center gap-2"><span>🤖</span> AI Managed</div>
                    <div className="text-[10px] text-[var(--color-mute)] font-medium leading-tight">Assistant sets the XI based on form and conditions.</div>
                  </button>
                  <button
                    onClick={() => setLocalControl('full')}
                    className={`p-4 rounded-xl text-left transition-all border-2 flex flex-col h-full ${
                      localControl === 'full' 
                        ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]' 
                        : 'bg-[var(--color-canvas-soft)] border-[var(--color-hairline)] hover:border-[var(--color-primary)]/50'
                    }`}
                  >
                    <div className="font-bold tracking-tight text-base text-[var(--color-ink)] mb-1 flex items-center gap-2"><span>👑</span> Full Control</div>
                    <div className="text-[10px] text-[var(--color-mute)] font-medium leading-tight">Manage playing XI manually before every match.</div>
                  </button>
                </div>
              </div>
            )}

            <div className="mt-auto pt-6 flex gap-3">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSimulate(localControl)} 
                className="flex-1 relative overflow-hidden rounded-2xl p-[2px] group shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)] via-yellow-400 to-[var(--color-primary)] animate-shimmer bg-[length:200%_100%]" />
                <div className="relative bg-[var(--color-canvas)] py-4 rounded-[14px] flex items-center justify-center gap-3 transition-colors group-hover:bg-transparent h-full">
                  <Play size={20} className="text-[var(--color-primary)] group-hover:text-black transition-colors" />
                  <span className="font-bold text-lg text-[var(--color-ink)] group-hover:text-black transition-colors tracking-tight">SIMULATE SEASON</span>
                </div>
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRestart} 
                className="w-16 h-[64px] rounded-2xl bg-[var(--color-canvas-soft-2)] text-[var(--color-mute)] hover:text-red-500 hover:bg-red-500/10 transition-colors border border-[var(--color-hairline)] flex items-center justify-center shadow-sm"
                title="Restart Draft"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Match Prep Screen ───────────────────────────────────────────
function MatchPrepScreen({
  squad,
  opponent,
  matchIdx,
  totalMatches,
  onSimulateMatch,
  playerForms,
  settings,
}: {
  squad: SquadSlot[];
  opponent: SeasonTeam;
  matchIdx: number;
  totalMatches: number;
  onSimulateMatch: (playingXI: Player[], impactBench: Player[], updatedSquad: SquadSlot[]) => void;
  playerForms: Record<number, PlayerForm>;
  settings: GameSettings;
}) {
  const [localSquad, setLocalSquad] = useState<SquadSlot[]>(() => JSON.parse(JSON.stringify(squad)));
  const [moveMode, setMoveMode] = useState(false);
  const [selectedSlotForMove, setSelectedSlotForMove] = useState<number | null>(null);

  const handleSlotClick = (idx: number) => {
    if (!moveMode) return;
    if (selectedSlotForMove === null) {
      if (localSquad[idx].player) setSelectedSlotForMove(idx);
    } else {
      const newSquad = [...localSquad];
      const temp = newSquad[selectedSlotForMove].player;
      newSquad[selectedSlotForMove].player = newSquad[idx].player;
      newSquad[idx].player = temp;
      setLocalSquad(newSquad);
      setSelectedSlotForMove(null);
    }
  };

  const handleClearXI = () => {
    const newSquad = [...localSquad];
    // get available bench indices
    const benchIndices = newSquad.map((s, i) => s.position === 'BENCH' && !s.player ? i : -1).filter(i => i !== -1);
    let benchPtr = 0;

    for (let i = 0; i < newSquad.length; i++) {
      if (newSquad[i].position !== 'BENCH' && newSquad[i].player) {
        if (benchPtr < benchIndices.length) {
          const bIdx = benchIndices[benchPtr];
          newSquad[bIdx].player = newSquad[i].player;
          newSquad[i].player = null;
          benchPtr++;
        }
      }
    }
    setLocalSquad(newSquad);
  };

  const playingXI = localSquad.filter(s => s.position !== 'BENCH' && s.player).map(s => s.player!);
  const impactBench = localSquad.filter(s => s.position === 'BENCH' && s.player).map(s => s.player!);
  const overseasCount = playingXI.filter(p => p.is_overseas).length;
  const isReady = playingXI.length === 11 && overseasCount <= 4;
  
  const strength = calcSquadStrength(localSquad); // this only counts first 11 filled, which works if they are on pitch since pitch is first 11

  return (
    <div className="min-h-screen flex max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 gap-6">
      {/* Left: Pitch & Bench */}
      <div className="w-[340px] flex-shrink-0 flex flex-col gap-4">
        <div className="flex items-center justify-between bg-[var(--color-canvas)] p-3 rounded-xl border border-[var(--color-hairline)]">
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-mute)] text-[10px] font-mono uppercase font-bold tracking-wider">Playing XI</span>
            <span className={`font-bold text-xs px-2 py-0.5 rounded-md ${playingXI.length === 11 ? 'bg-green-900/50 text-green-400' : 'bg-[var(--color-canvas)] text-[var(--color-ink)]'}`}>{playingXI.length}/11</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-mute)] text-[10px] font-mono uppercase font-bold tracking-wider">Overseas</span>
            <span className={`font-bold text-xs px-2 py-0.5 rounded-md ${overseasCount > 4 ? 'bg-red-900/50 text-red-400' : 'bg-[var(--color-canvas)] text-[var(--color-ink)]'}`}>{overseasCount}/4</span>
          </div>
        </div>

        <WheelLayout 
          squad={localSquad.filter(s => s.position !== 'BENCH')} 
          onSlotClick={(idx) => moveMode ? handleSlotClick(idx) : setSelectedSlotForMove(idx === selectedSlotForMove ? null : idx)} 
          settings={settings} 
          selectedSlot={selectedSlotForMove}
        />
        <BenchLayout 
          squad={localSquad} 
          onSlotClick={(idx) => moveMode ? handleSlotClick(idx) : setSelectedSlotForMove(idx === selectedSlotForMove ? null : idx)} 
          settings={settings} 
          selectedSlot={selectedSlotForMove} 
        />
        
        <div className="flex gap-2">
          <button
            onClick={() => {
              setMoveMode(!moveMode);
              setSelectedSlotForMove(null);
            }}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors border ${
              moveMode 
                ? 'bg-[var(--color-ink)] text-[var(--color-canvas)] border-[var(--color-ink)]'
                : 'bg-[var(--color-canvas)] text-[var(--color-ink)] border-[var(--color-hairline)] hover:bg-green-800/50'
            }`}
          >
            {moveMode ? '↔ Done moving' : '↔ Swap Players'}
          </button>
          <button
            onClick={handleClearXI}
            className="px-4 py-3 rounded-xl font-bold text-sm bg-[var(--color-canvas)] text-red-400 border border-red-900 hover:bg-red-900/20 transition-colors"
          >
            Clear XI
          </button>
        </div>
        {moveMode && (
          <div className="text-[10px] text-[var(--color-mute)] text-center leading-relaxed">
            <strong className="text-[var(--color-mute)]">Tap a player</strong> to select them, then tap another slot (pitch or bench) to swap.
          </div>
        )}
      </div>

      {/* Right: Opponent & Stats */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="card p-6 border-2 border-yellow-900/30">
          <div className="text-xs text-yellow-500 font-bold uppercase tracking-widest mb-4 border-b border-[var(--color-hairline)] pb-2">
            Match {matchIdx + 1} of {totalMatches}
          </div>
          <div className="flex items-center justify-between mb-8">
            <div className="text-center">
              <div className="text-sm text-[var(--color-mute)] uppercase tracking-widest font-bold mb-2">YOUR XI</div>
              <div className="text-4xl font-semibold tracking-tight text-yellow-400">OVR {strength.overall}</div>
            </div>
            <div className="text-2xl font-semibold tracking-tight text-gray-600 px-6">VS</div>
            <div className="text-center">
              <div className="text-sm text-[var(--color-mute)] uppercase tracking-widest font-bold mb-2">{opponent.name}</div>
              <div className="text-4xl font-semibold tracking-tight text-[var(--color-mute)]">OVR {opponent.overall}</div>
            </div>
          </div>
          
          <div className="flex justify-center mt-6">
            <motion.button
              whileHover={isReady ? { scale: 1.05 } : {}}
              whileTap={isReady ? { scale: 0.95 } : {}}
              disabled={!isReady}
              onClick={() => onSimulateMatch(playingXI, impactBench, localSquad)}
              className={`text-2xl font-semibold tracking-tight px-16 py-5 uppercase tracking-widest w-full max-w-md rounded-2xl transition-all shadow-2xl ${
                isReady 
                  ? 'btn-primary pulse-gold' 
                  : 'bg-[var(--color-canvas)] text-[var(--color-mute)] cursor-not-allowed border border-[var(--color-hairline)]'
              }`}
            >
              SIMULATE MATCH ▶
            </motion.button>
          </div>
          {!isReady && (
            <div className="text-center mt-4 text-sm font-bold text-red-400">
              {playingXI.length !== 11 ? `You need exactly 11 players on the pitch (currently ${playingXI.length}).` : `Too many overseas players! Maximum allowed is 4 (currently ${overseasCount}).`}
            </div>
          )}
        </div>

        <div className="card p-4 overflow-y-auto flex-1 custom-scrollbar">
           <div className="text-xs text-[var(--color-mute)] uppercase tracking-widest font-bold mb-3 border-b border-[var(--color-hairline)] pb-2">Your Squad Form</div>
           <div className="grid grid-cols-2 gap-3">
             {localSquad.filter(s => s.player).map(slot => (
               <div key={slot.player!.id} className={`bg-[var(--color-canvas)] border rounded-lg p-3 ${slot.position === 'BENCH' ? 'border-[var(--color-hairline)] opacity-60' : 'border-[var(--color-hairline)]'}`}>
                 <div className="flex items-center gap-2 mb-2">
                   <RatingBadge rating={slot.player!.overall} size="sm" hidden={settings.showRatings === 'off'} />
                   <div className="flex-1 min-w-0">
                     <div className="font-bold text-[var(--color-ink)] text-sm truncate">{slot.player!.name} {slot.player!.is_overseas && '✈️'}</div>
                     <div className="text-[10px] text-[var(--color-mute)] uppercase font-bold">{slot.position === 'BENCH' ? 'Bench' : 'Playing XI'}</div>
                   </div>
                 </div>
                 <PlayerFormInline form={playerForms[slot.player!.id]} compact />
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}

// ─── Share Modal ──────────────────────────────────────────────
import { toBlob } from 'html-to-image';

// ─── Share Card Components ──────────────────────────────────────────────
export function getCardTier(results: any, isChampion: boolean) {
  const playoffWins = (results.playoffMatches || []).filter((m: any) => m.winner?.toUpperCase() === 'YOUR XI').length;
  const playoffLosses = (results.playoffMatches || []).filter((m: any) => (m.team1?.toUpperCase() === 'YOUR XI' || m.team2?.toUpperCase() === 'YOUR XI') && m.winner?.toUpperCase() !== 'YOUR XI').length;
  const wins = results.userTeam.won + playoffWins;
  const losses = results.userTeam.lost + playoffLosses;
  
  if (wins === 16 && losses === 0) return { tier: 'PLATINUM', name: 'THE IMMORTAL', style: 'mesh-gradient-multi text-white border-transparent shadow-vercel-4', badge: 'bg-white/20 text-white border border-white/30' };
  if (wins === 15 && losses === 1 && isChampion) return { tier: 'DIAMOND', name: 'THE CHAMPION', style: 'bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-gradient-develop-start)] shadow-vercel-4', badge: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', gradientText: 'mesh-gradient-develop text-transparent-bg' };
  if (isChampion) return { tier: 'GOLD', name: 'THE CHAMPION', style: 'bg-[var(--color-primary)] text-[var(--color-warning)] border-[var(--color-warning)] shadow-vercel-4', badge: 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' };
  
  const madePlayoffs = results.finalPos <= 4;
  if (madePlayoffs) {
    return { tier: 'SILVER', name: wins >= 12 ? 'THE CONTENDER' : wins >= 10 ? 'THE CHALLENGER' : 'THE SURVIVOR', style: 'bg-[var(--color-canvas-soft-2)] text-[var(--color-ink)] border-[var(--color-hairline-strong)] shadow-vercel-3', badge: 'bg-gray-500/20 text-gray-700 border border-gray-500/30' };
  }
  
  const title = wins >= 8 ? 'THE SURVIVOR' : wins >= 4 ? 'THE COLLAPSE' : 'THE DISGRACE';
  return { tier: 'STANDARD', name: title, style: 'bg-[var(--color-canvas-soft)] text-[var(--color-ink)] border-[var(--color-hairline)] shadow-vercel-2', badge: 'bg-[var(--color-hairline)] text-[var(--color-mute)] border border-[var(--color-hairline-strong)]' };
}

function ShareCardNode({ squad, results, strength, isFlipped, isChampion, staticRender = false }: any) {
  const tierInfo = getCardTier(results, isChampion);
  const teamType = "FRANCHISE XI"; 
  const playoffWins = (results.playoffMatches || []).filter((m: any) => m.winner?.toUpperCase() === 'YOUR XI').length;
  const playoffLosses = (results.playoffMatches || []).filter((m: any) => (m.team1?.toUpperCase() === 'YOUR XI' || m.team2?.toUpperCase() === 'YOUR XI') && m.winner?.toUpperCase() !== 'YOUR XI').length;
  const totalWins = results.userTeam.won + playoffWins;
  const totalLosses = results.userTeam.lost + playoffLosses;

  const FrontContent = (
    <>
      <div className="flex flex-col items-center text-center mt-2">
        <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${tierInfo.badge} mb-4`}>
           {tierInfo.tier} TIER
        </div>
        <div className={`text-8xl font-black tracking-tighter leading-none mb-1 ${tierInfo.gradientText || ''}`}>
           {totalWins}-{totalLosses}
        </div>
        <div className="text-2xl font-black uppercase tracking-widest opacity-90">
           {tierInfo.name}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center py-4">
        <Trophy size={64} className="opacity-20" />
      </div>

      <div className="w-full">
         <div className="flex justify-between items-start mb-4 gap-2">
           <div className="flex-1 text-left">
             <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1 leading-tight">Top Run Scorer</div>
             <div className="font-bold text-sm leading-tight">{results.awards['Orange Cap']?.player || '—'}</div>
           </div>
           <div className="flex-1 text-right">
             <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1 leading-tight">Top Wicket Taker</div>
             <div className="font-bold text-sm leading-tight">{results.awards['Purple Cap']?.player || '—'}</div>
           </div>
         </div>
         <div className="text-center text-[10px] font-bold uppercase tracking-widest opacity-50 border-t border-current/20 pt-3">
           16-0play.com
         </div>
      </div>
    </>
  );

  const BackContent = (
    <>
      <div className="text-center mb-4 mt-2">
        <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">MY XI</div>
        <div className="text-xl font-black uppercase tracking-widest">{teamType}</div>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-1.5 px-2">
         {squad.filter((s: any) => s.player).slice(0,11).map((s: any, idx: number) => (
           <div key={idx} className="flex justify-between items-center text-xs">
             <div className="font-mono opacity-50 w-5">{idx + 1}.</div>
             <div className="flex-1 font-bold truncate">{s.player.name} {idx === 0 && <span className="text-[9px] ml-1 opacity-70">(C)</span>}</div>
             <div className="font-mono font-bold opacity-80">{s.player.overall}</div>
           </div>
         ))}
      </div>

      <div className="border-t border-current/20 pt-3 mt-4 flex justify-between items-center px-2">
         <div className="text-xs font-bold uppercase tracking-widest opacity-60">Team Overall</div>
         <div className="text-2xl font-black">{strength.overall}</div>
      </div>
    </>
  );

  if (staticRender) {
    return (
      <div className={`relative w-full h-full rounded-[2rem] p-6 flex flex-col ${isFlipped ? 'border ' + (tierInfo.tier === 'PLATINUM' ? 'bg-[#0a0a0a] text-white border-[var(--color-hairline-strong)]' : tierInfo.style) : `justify-between border ${tierInfo.style}`}`}>
        {isFlipped ? BackContent : FrontContent}
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[5/7] preserve-3d transition-transform duration-500" style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
      {/* FRONT */}
      <div className={`absolute inset-0 backface-hidden rounded-[2rem] p-6 flex flex-col justify-between border ${tierInfo.style}`}>
        {FrontContent}
      </div>

      {/* BACK */}
      <div className={`absolute inset-0 backface-hidden rounded-[2rem] p-6 flex flex-col border rotate-y-180 ${tierInfo.tier === 'PLATINUM' ? 'bg-[#0a0a0a] text-white border-[var(--color-hairline-strong)]' : tierInfo.style}`}>
        {BackContent}
      </div>
    </div>
  );
}

function ShareModal({ squad, results, strength, onClose }: any) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  const isChampion = results.champion?.toUpperCase() === 'YOUR XI';

  const generateBlob = async () => {
    // Wait for layout to flush
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const options = { 
      backgroundColor: '#111', 
      pixelRatio: 2,
      cacheBust: true,
      style: {
        opacity: '1',
        transform: 'none'
      }
    };
    
    // Quick dummy render hack to force html-to-image to compute styles correctly
    await toBlob(cardRef.current!, { width: 10, height: 10, ...options });
    
    return await toBlob(cardRef.current!, options);
  };

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '16-0_share_card.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!cardRef.current || isSharing) return;
    setIsSharing(true);
    try {
      const blob = await generateBlob();
      
      if (!blob) {
        setIsSharing(false);
        alert("Could not generate image.");
        return;
      }
      
      const file = new File([blob], '16-0_share_card.png', { type: 'image/png' });
      const shareData = {
        title: '16-0play',
        text: `I just went ${results.userTeam.won}-${results.userTeam.lost} on 16-0.app! Can you beat my record?`,
        files: [file]
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
        } catch (e) {
          console.error('Error sharing:', e);
        }
      } else {
        downloadBlob(blob);
        alert("Image downloaded! Your browser doesn't support direct app sharing, so you can manually attach this image to Twitter or WhatsApp.");
      }
    } catch (err) {
      console.error("Share error:", err);
      alert("Something went wrong while generating the share image. Check the console for details.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadOnly = async () => {
    if (!cardRef.current || isSharing) return;
    setIsSharing(true);
    try {
      const blob = await generateBlob();
      
      if (!blob) {
        setIsSharing(false);
        alert("Could not generate image.");
        return;
      }
      
      downloadBlob(blob);
    } catch (err) {
      console.error("Download error:", err);
      alert("Something went wrong while downloading the image.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-primary)]/80 backdrop-blur-sm p-4 perspective-1000">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-lg bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-2xl overflow-hidden shadow-vercel-4 flex flex-col items-center"
      >
        <div className="flex justify-between items-center w-full p-4 border-b border-[var(--color-hairline)]">
          <h2 className="text-lg font-bold text-[var(--color-ink)]">Share Your Result</h2>
          <button onClick={onClose} className="text-[var(--color-mute)] hover:text-[var(--color-ink)]">✕</button>
        </div>
        
        {/* Interactive Flipping Card */}
        <div 
          onClick={() => setIsFlipped(!isFlipped)} 
          className="p-8 bg-[var(--color-canvas-soft)] cursor-pointer group relative w-full flex justify-center"
          title="Click to flip"
          style={{ perspective: '1000px' }}
        >
          <div className="absolute top-4 right-4 z-20 pointer-events-none">
            <span className="bg-[var(--color-canvas)] text-[var(--color-ink)] text-xs font-bold py-1.5 px-3 rounded-full border border-[var(--color-hairline)] shadow-vercel-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to Flip ↺
            </span>
          </div>
          
          <div className="w-[320px]">
             <ShareCardNode squad={squad} results={results} strength={strength} isFlipped={isFlipped} isChampion={isChampion} />
          </div>
        </div>
        
        {/* Hidden Export Container (Rendered side-by-side for html-to-image without 3D transforms) */}
        <div 
          ref={cardRef} 
          className="absolute left-0 top-0 bg-[#111] p-12 flex gap-12 items-center justify-center pointer-events-none dark" 
          style={{ width: '1200px', height: '675px', opacity: 0.001, zIndex: -10 }}
        >
           <div style={{ width: '400px', height: '560px' }}>
             <ShareCardNode squad={squad} results={results} strength={strength} isFlipped={false} isChampion={isChampion} staticRender={true} />
           </div>
           <div style={{ width: '400px', height: '560px' }}>
             <ShareCardNode squad={squad} results={results} strength={strength} isFlipped={true} isChampion={isChampion} staticRender={true} />
           </div>
           
           <div className="absolute bottom-8 right-12 text-white/40 font-mono text-sm tracking-widest">
             16-0play.com
           </div>
        </div>
        
        <div className="p-4 border-t border-[var(--color-hairline)] flex gap-2 bg-[var(--color-canvas-soft-2)] w-full">
          <button 
            onClick={(e) => { e.stopPropagation(); handleShare(); }}
            disabled={isSharing}
            className="btn-primary flex-1 py-3 font-bold flex items-center justify-center gap-2 px-2 text-sm"
          >
            {isSharing ? 'Generating...' : '🔗 Share'}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleDownloadOnly(); }}
            disabled={isSharing}
            className="flex-1 py-3 font-bold bg-[var(--color-canvas)] text-[var(--color-ink)] border border-[var(--color-hairline)] hover:bg-[var(--color-canvas-soft)] rounded-[100px] flex items-center justify-center gap-2 px-2 text-sm transition-all"
          >
            {isSharing ? '...' : '↓ Download'}
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold bg-[var(--color-canvas)] text-[var(--color-mute)] hover:text-[var(--color-ink)] border border-transparent hover:bg-[var(--color-canvas-soft)]"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}


export interface SimResults {
  teams: SeasonTeam[];
  userTeam: SeasonTeam;
  finalPos: number;
  projectedPos: number;
  awards: Record<string, { player: string; team: string }>;
  story: StoryItem[];
  champion: string;
  playoffMatches: PlayoffMatch[];
  playerStats: Record<number, PlayerStats>;
  playerForms: Record<number, PlayerForm>;
  matches: MatchResult[];
}

// ─── Results Screen ───────────────────────────────────────────
function ResultsScreen({
  squad,
  results,
  settings,
  onRestart,
  onViewLeaderboard,
}: {
  squad: SquadSlot[];
  results: SimResults;
  settings: GameSettings;
  onRestart: () => void;
  onViewLeaderboard: () => void;
}) {
  const { teams, userTeam, finalPos, projectedPos, awards, story, champion, playoffMatches, playerStats, playerForms, matches } = results;
  const isChampion = champion?.toUpperCase() === 'YOUR XI';
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const strength = calcSquadStrength(squad);
  const userPlayoffMatches = playoffMatches?.filter(m => m.team1?.toUpperCase() === 'YOUR XI' || m.team2?.toUpperCase() === 'YOUR XI') || [];
  const playoffWins = userPlayoffMatches.filter(m => m.winner?.toUpperCase() === 'YOUR XI').length;
  const playoffLosses = userPlayoffMatches.filter(m => m.winner?.toUpperCase() !== 'YOUR XI').length;
  const totalWins = (userTeam?.won || 0) + playoffWins;
  const totalLosses = (userTeam?.lost || 0) + playoffLosses;
  const lastMatch = userPlayoffMatches[userPlayoffMatches.length - 1];
  let playoffSubText = '';
  let finalPosText = `${finalPos}${['st','nd','rd'][finalPos-1]||'th'}`;
  
  if (finalPos <= 4 && !isChampion && lastMatch) {
    if (lastMatch.name === 'Final') {
      playoffSubText = 'Runner Up';
      finalPosText = 'Runner Up';
    } else if (lastMatch.name === 'Qualifier 2') {
      playoffSubText = 'Qualifier 2';
      finalPosText = 'Qualifier 2';
    } else if (lastMatch.name === 'Eliminator') {
      playoffSubText = 'Lost in Eliminator';
      finalPosText = 'Eliminator';
    } else {
      playoffSubText = `Lost in ${lastMatch.name}`;
      finalPosText = lastMatch.name;
    }
  } else if (isChampion) {
    finalPosText = 'Champions';
  }

  const handleSubmitLeaderboard = async () => {
    setSubmitError('');
    try {
      const entry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        mode: settings?.mode || 'classic',
        wins: totalWins,
        losses: totalLosses,
        points: userTeam?.points || 0,
        nrr: userTeam?.nrr || 0,
        position: finalPos,
        champion: isChampion,
        overall: strength.overall,
        finish: finalPosText,
        difficulty: settings?.difficulty || 'normal',
        showRatings: settings?.showRatings || 'on'
      };
      
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to submit leaderboard entry');
      }

      setSubmitted(true);
      onViewLeaderboard();
    } catch (e: any) {
      console.error(e);
      setSubmitError(e.message || 'An error occurred.');
    }
  };

  const [showShare, setShowShare] = useState(false);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-[var(--color-canvas)] to-[var(--color-canvas-soft-2)] relative overflow-x-hidden">
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[var(--color-primary)] opacity-5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-yellow-500 opacity-5 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/4" />
      
      <div className="max-w-[1400px] mx-auto relative z-10 space-y-6 md:space-y-8">
        
        {/* Header section w/ Actions */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onRestart} className="btn-secondary py-2 px-6 flex items-center gap-2">
              <span>↻</span> Start New Season
            </button>
            <button onClick={onViewLeaderboard} className="btn-secondary py-2 px-6">
              View Leaderboard
            </button>
          </div>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center py-10 md:py-16 rounded-[2rem] border border-[var(--color-hairline)] shadow-2xl relative overflow-hidden ${
            isChampion 
              ? 'bg-gradient-to-br from-yellow-500/10 to-yellow-900/10 border-yellow-500/30' 
              : 'bg-[var(--color-canvas)]/60 backdrop-blur-md'
          }`}
        >
          {isChampion && (
            <div className="absolute inset-0 bg-yellow-500/5 mix-blend-overlay pointer-events-none" />
          )}
          <div className="relative z-10">
            {isChampion ? (
              <>
                <div className="text-7xl mb-4 md:mb-6 animate-bounce drop-shadow-[0_0_25px_rgba(234,179,8,0.4)]">🏆</div>
                <div className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 drop-shadow-sm mb-3">
                  {totalLosses === 0 ? '16-0 ACHIEVED!' : 'CHAMPIONS!'}
                </div>
                <div className="text-[var(--color-mute)] text-lg md:text-xl font-medium tracking-tight">Your XI etched their name in history.</div>
              </>
            ) : (
              <>
                <div className="text-6xl font-black tracking-tighter text-[var(--color-ink)] mb-4">Season Over</div>
                {finalPos > 4 ? (
                  <div className="text-2xl font-bold text-red-500 uppercase tracking-widest bg-red-500/10 inline-block px-4 py-2 rounded-xl border border-red-500/20">
                    Finished {finalPos}<span className="text-xl">{['st','nd','rd'][finalPos-1]||'th'}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 mt-4">
                    <div className="text-2xl md:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
                      PLAYOFFS REACHED
                    </div>
                    {playoffSubText && (
                      <div className="text-lg font-bold text-red-400 bg-red-400/10 px-4 py-1.5 rounded-lg border border-red-400/20 uppercase tracking-widest mt-2">
                        {playoffSubText}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: 'Final Position', val: finalPosText, color: '#f5c842' },
            { label: 'Projected Position', val: `${projectedPos}${['st','nd','rd'][projectedPos-1]||'th'}`, color: '#6b7280' },
            { label: 'Wins - Losses', val: `${totalWins} - ${totalLosses}`, color: '#22c55e' },
            { label: 'Overall Rating', val: strength.overall, color: '#7c3aed' },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-[var(--color-canvas)]/80 backdrop-blur-md p-6 rounded-2xl border border-[var(--color-hairline)] shadow-sm text-center flex flex-col items-center justify-center gap-2 hover:border-[var(--color-primary)]/30 transition-colors">
              <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-mute)]">{label}</div>
              <div className="text-3xl md:text-4xl font-black tracking-tighter" style={{ color }}>{val}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
          {/* Main Content Area */}
          <div className="xl:col-span-8 flex flex-col gap-6 md:gap-8">
            {/* Story */}
            <div className="bg-[var(--color-canvas)]/80 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-[var(--color-hairline)] shadow-sm">
              <div className="text-xs text-[var(--color-mute)] uppercase tracking-widest font-bold mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 rounded-full bg-[var(--color-primary)]" />
                Season Story
              </div>
              <div className="space-y-5">
                {story.map((item) => (
                  <div key={item.id} className="flex gap-4 md:gap-5 items-start p-4 rounded-xl hover:bg-[var(--color-canvas-soft-2)] transition-colors border border-transparent hover:border-[var(--color-hairline)]">
                    <div className="text-2xl md:text-3xl mt-1 shrink-0 bg-[var(--color-canvas)] w-12 h-12 flex items-center justify-center rounded-full shadow-sm border border-[var(--color-hairline)]">
                      {item.type === 'news' ? '📰' : item.type === 'expert' ? '🎙️' : item.type === 'player' ? '🏏' : '💬'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="font-bold text-[var(--color-ink)]">{item.author}</span>
                        <span className="text-[9px] text-[var(--color-mute)] uppercase tracking-widest font-bold border border-[var(--color-hairline)] px-2 py-0.5 rounded-full bg-[var(--color-canvas)] shadow-sm">{item.type}</span>
                      </div>
                      <div className="text-sm md:text-base text-[var(--color-mute)] leading-relaxed italic font-medium">"{item.text}"</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* League Table */}
            <div className="bg-[var(--color-canvas)]/80 backdrop-blur-md rounded-2xl overflow-hidden border border-[var(--color-hairline)] shadow-sm">
              <div className="p-5 font-bold text-[var(--color-ink)] bg-[var(--color-canvas-soft-2)] border-b border-[var(--color-hairline)] flex justify-between items-center text-sm tracking-tight">
                <span>Final League Table</span>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[var(--color-canvas-soft)] border-b border-[var(--color-hairline)]">
                      <th className="py-4 pl-5 font-bold uppercase tracking-widest text-[10px] text-[var(--color-mute)] w-12">#</th>
                      <th className="py-4 px-3 font-bold uppercase tracking-widest text-[10px] text-[var(--color-mute)]">Team</th>
                      <th className="py-4 px-3 font-bold uppercase tracking-widest text-[10px] text-[var(--color-mute)] text-center">P</th>
                      <th className="py-4 px-3 font-bold uppercase tracking-widest text-[10px] text-[var(--color-mute)] text-center">W</th>
                      <th className="py-4 px-3 font-bold uppercase tracking-widest text-[10px] text-[var(--color-mute)] text-center">L</th>
                      <th className="py-4 px-3 font-bold uppercase tracking-widest text-[10px] text-[var(--color-mute)] text-center">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((t, i) => (
                      <tr key={t.short} className={`transition-colors border-b border-[var(--color-hairline)]/50 last:border-0 ${t.short === 'YOUR XI' ? 'bg-yellow-500/10' : 'hover:bg-[var(--color-canvas-soft-2)]'} ${i === 3 ? 'border-b-[var(--color-success)] border-b-2' : ''}`}>
                        <td className="py-3 pl-5 text-[var(--color-mute)] font-mono font-bold text-sm">{i + 1}</td>
                        <td className={`py-3 px-3 font-bold tracking-tight text-sm ${t.short === 'YOUR XI' ? 'text-yellow-400' : 'text-[var(--color-ink)]'}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 shadow-sm" style={{ background: teamColor(t.short) }}>
                              <span className="text-[9px] font-bold tracking-tight text-white">{t.short.slice(0, 1)}</span>
                            </div>
                            {t.name}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center text-[var(--color-mute)] font-mono font-medium">14</td>
                        <td className="py-3 px-3 text-center text-[var(--color-success)] font-mono font-bold">{t.won}</td>
                        <td className="py-3 px-3 text-center text-[var(--color-error)] font-mono font-bold">{t.lost}</td>
                        <td className={`py-3 px-3 text-center font-black tracking-tight font-mono text-base ${t.short === 'YOUR XI' ? 'text-yellow-400' : 'text-[var(--color-ink)]'}`}>{t.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Playoff Bracket */}
            {playoffMatches && playoffMatches.length > 0 && (
              <div className="bg-[var(--color-canvas)]/80 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-[var(--color-hairline)] shadow-sm overflow-hidden">
                <div className="text-xs text-[var(--color-mute)] uppercase tracking-[0.15em] mb-8 text-center font-bold">Playoffs Bracket</div>
                <PlayoffBracket matches={playoffMatches} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-4 flex flex-col gap-6 md:gap-8">
            {/* Awards */}
            <div className="bg-[var(--color-canvas)]/80 backdrop-blur-md rounded-2xl overflow-hidden border border-[var(--color-hairline)] shadow-sm flex flex-col">
              <div className="p-5 font-bold text-[var(--color-ink)] bg-[var(--color-canvas-soft-2)] border-b border-[var(--color-hairline)] text-sm tracking-tight flex items-center gap-2">
                <span>Season Awards</span>
              </div>
              <div className="p-5 grid grid-cols-1 gap-4 flex-1">
                {Object.entries(awards).map(([awardName, info]) => (
                  <div key={awardName} className="bg-[var(--color-canvas-soft)] p-5 rounded-xl border border-[var(--color-hairline)] flex flex-col justify-center relative overflow-hidden group hover:border-[var(--color-primary)]/30 transition-colors">
                    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] pointer-events-none opacity-20 ${
                      awardName.includes('Orange') ? 'bg-orange-500' :
                      awardName.includes('Purple') ? 'bg-purple-500' :
                      awardName.includes('MVP') ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div className={`text-[10px] uppercase tracking-widest font-bold mb-1.5 z-10 ${
                      awardName.includes('Orange') ? 'text-orange-400' :
                      awardName.includes('Purple') ? 'text-purple-400' :
                      awardName.includes('MVP') ? 'text-yellow-400' : 'text-blue-400'
                    }`}>{awardName}</div>
                    <div className="text-xl font-black tracking-tight text-[var(--color-ink)] z-10 truncate">{info.player}</div>
                    <div className="text-xs font-bold text-[var(--color-mute)] uppercase tracking-widest mt-1 z-10">{info.team}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tournament Leaders Panel at end of season */}
        <div className="mb-6 h-[400px]">
          <LiveStatsPanel stats={playerStats} isFinal />
        </div>

        {/* Player Stats Table */}
        {playerStats && <PlayerStatsTable squad={squad} stats={playerStats} playerForms={playerForms} />}

        {/* Season Fixtures */}
        <div className="card mb-6 overflow-hidden">
          <details className="group">
            <summary className="p-4 cursor-pointer font-bold text-[var(--color-mute)] hover:text-[var(--color-ink)] flex justify-between items-center bg-[var(--color-canvas)] select-none">
              <span className="text-sm uppercase tracking-wider">All Season Fixtures</span>
              <span className="text-xl group-open:rotate-180 transition-transform text-[var(--color-mute)]">▾</span>
            </summary>
            <div className="p-4 border-t border-[var(--color-hairline)] bg-[var(--color-canvas-soft-2)] max-h-96 overflow-y-auto custom-scrollbar">
              {matches && matches.map((m: MatchResult, i: number) => {
                const isHomeWinner = m.winner === m.homeTeam;
                const isAbandoned = m.rainEvent?.type === 'abandoned';
                return (
                  <details key={i} className="group border-b border-[var(--color-hairline)]/50 last:border-0">
                    <summary className="flex justify-between items-center py-3 cursor-pointer hover:bg-white/5 transition-colors select-none list-none [&::-webkit-details-marker]:hidden">
                      <div className="w-8 text-[var(--color-mute)] font-mono text-xs pl-2">#{i + 1}</div>
                      <div className="flex-1 flex flex-col items-end gap-0.5 text-xs">
                        <span className={`font-bold ${isHomeWinner && !isAbandoned ? 'text-[var(--color-gold)]' : 'text-[var(--color-mute)]'}`}>{m.homeTeam}</span>
                        {m.motm && isHomeWinner && !isAbandoned && <span className="text-[9px] text-[var(--color-gold-dim)]/60 uppercase tracking-widest">⭐ {m.motm.player.name.split(' ').pop()}</span>}
                      </div>
                      <div className="px-3 text-gray-600 font-bold tracking-widest text-[10px]">
                        {m.rainEvent ? '🌧' : 'VS'}
                      </div>
                      <div className="flex-1 flex flex-col items-start gap-0.5 text-xs">
                        <span className={`font-bold ${!isHomeWinner && !isAbandoned ? 'text-[var(--color-gold)]' : 'text-[var(--color-mute)]'}`}>{m.awayTeam}</span>
                        {m.motm && !isHomeWinner && !isAbandoned && <span className="text-[9px] text-[var(--color-gold-dim)]/60 uppercase tracking-widest">⭐ {m.motm.player.name.split(' ').pop()}</span>}
                      </div>
                    </summary>
                    <div className="p-4 bg-[var(--color-canvas)] border-t border-[var(--color-hairline)]/50">
                      {isAbandoned ? (
                        <div className="flex items-center gap-3 justify-center py-2 bg-blue-950/30 rounded-lg border border-blue-800/30">
                          <span className="text-2xl">🌧</span>
                          <div>
                            <div className="text-blue-300 font-bold text-sm">Match Abandoned</div>
                            <div className="text-blue-400/70 text-xs">No result — 1 point each</div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center mb-5 text-sm font-bold bg-[var(--color-canvas-soft-2)] p-3 rounded-lg border border-[var(--color-hairline)]">
                            <div className="flex-1 text-right text-[var(--color-mute)]">{m.homeScore}</div>
                            <div className="px-4 text-[var(--color-win)] text-[10px] font-semibold tracking-tight uppercase tracking-widest text-center">
                              <div>{m.winner} WON</div>
                              <div className="text-[var(--color-mute)] mt-0.5">{m.margin}</div>
                              {m.rainEvent && <div className="text-[var(--color-link)] mt-0.5">🌧 DLS</div>}
                            </div>
                            <div className="flex-1 text-left text-[var(--color-mute)]">{m.awayScore}</div>
                          </div>

                          {m.destinyTriggered && (
                            <div className="mb-4 flex justify-center text-center">
                              <span className="text-xs font-bold px-3 py-1 bg-[var(--color-gold)] text-[var(--color-on-primary)] rounded-full shadow-[0_0_15px_rgba(245,200,66,0.5)]">
                                ⭐ THE UNTHINKABLE! Perfect Season Destiny Saved!
                              </span>
                            </div>
                          )}

                          {m.clutchTriggered && (
                            <div className="mb-4 flex justify-center text-center">
                              <span className="text-[10px] font-bold px-2 py-0.5 border border-red-500/50 text-red-400 rounded bg-red-950/50 uppercase tracking-widest">
                                ⚡ {m.clutchTriggered} Delivers Under Pressure!
                              </span>
                            </div>
                          )}
                          
                          {(m.momentumStateA || m.momentumStateB) && (
                            <div className="mb-4 flex flex-col gap-1 items-center">
                              {m.momentumStateA && <span className="text-[9px] font-bold px-2 py-0.5 bg-orange-900/50 text-orange-400 rounded uppercase">🔥 {m.homeTeam}: {m.momentumStateA}</span>}
                              {m.momentumStateB && <span className="text-[9px] font-bold px-2 py-0.5 bg-orange-900/50 text-orange-400 rounded uppercase">🔥 {m.awayTeam}: {m.momentumStateB}</span>}
                            </div>
                          )}
                          
                          {m.motm && (
                            <div className="flex items-center gap-4 bg-[var(--color-canvas-soft)] p-3 rounded-xl border border-[var(--color-gold)]/30">
                              <div className="w-12 h-12 bg-[var(--color-canvas)] border-2 border-[var(--color-gold)]/50 rounded-full flex items-center justify-center text-xl font-bold text-[var(--color-gold)] shadow-[0_0_15px_rgba(245,200,66,0.15)] shrink-0">
                                {initials(m.motm.player.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[var(--color-gold)] font-semibold tracking-tight tracking-wide truncate">{m.motm.player.name}</span>
                                  <span className="text-[9px] uppercase tracking-wider font-bold bg-[var(--color-gold)]/20 text-[var(--color-gold)] px-1.5 py-0.5 rounded shrink-0">MotM</span>
                                </div>
                                <div className="text-[var(--color-mute)] text-sm font-semibold truncate">{m.motm.summary}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-[9px] uppercase tracking-widest text-[var(--color-mute)] mb-0.5">Rating</div>
                                <div className="text-lg font-semibold tracking-tight text-[var(--color-ink)]">{m.motm.rating.toFixed(1)}</div>
                              </div>
                            </div>
                          )}
                          
                          <MatchHighlightsList highlights={m.highlights} />
                        </>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          </details>
        </div>

        <div className="bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-6 rounded-2xl mb-6 shadow-xl relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="relative z-10 flex flex-col gap-4">
             <div>
               <h3 className="text-xl font-semibold tracking-tight text-[var(--color-ink)] tracking-widest uppercase mb-1">Add this run to the leaderboard</h3>
               <p className="text-sm font-medium text-[var(--color-mute)]">Your unique username will be automatically generated.</p>
             </div>
             
             {!submitted ? (
               <div className="flex flex-col gap-3">
                 <div className="flex gap-3">
                   <motion.button
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.97 }}
                     onClick={handleSubmitLeaderboard}
                     className="w-full bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-on-primary)] font-semibold tracking-tight uppercase tracking-widest px-8 py-3 rounded-xl transition-colors shadow-lg"
                   >
                     Add to Leaderboard
                   </motion.button>
                 </div>
                 {submitError && (
                   <div className="text-red-500 text-sm font-semibold tracking-wide bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl">
                     ⚠️ {submitError}
                   </div>
                 )}
               </div>
             ) : (
               <div className="flex items-center gap-2 text-green-400 font-bold uppercase tracking-widest text-sm bg-green-500/10 p-4 rounded-xl border border-green-500/20">
                 <span>✓</span> Submitted to Leaderboard
               </div>
             )}
           </div>
        </div>

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRestart}
            className="btn-primary flex-1 text-lg"
          >
            ↺ Play Again — New Run
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowShare(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border border-green-700 bg-green-600/15 text-green-400 hover:bg-green-600/25 transition-colors flex-shrink-0"
          >
            <span>🔗</span> Share
          </motion.button>
        </div>

        <AnimatePresence>
          {showShare && (
            <ShareModal
              squad={squad}
              results={results}
              strength={strength}
              onClose={() => setShowShare(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const HighlightIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'batting': return <Swords size={14} className="text-blue-400" />;
    case 'bowling': return <Target size={14} className="text-red-400" />;
    case 'milestone': return <Trophy size={14} className="text-yellow-400" />;
    case 'clutch': return <Zap size={14} className="text-purple-400" />;
    case 'fielding': return <Hand size={14} className="text-green-400" />;
    case 'team': return <TrendingUp size={14} className="text-orange-400" />;
    default: return <Zap size={14} className="text-[var(--color-mute)]" />;
  }
};

const MatchHighlightsList = ({ highlights }: { highlights?: MatchHighlight[] }) => {
  if (!highlights || highlights.length === 0) return null;
  return (
    <div className="mt-4 pt-4 border-t border-[var(--color-hairline)]/50">
      <div className="text-[10px] uppercase tracking-widest text-[var(--color-mute)] font-bold mb-3 pl-1 flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
        Match Highlights
      </div>
      <div className="flex flex-col gap-2">
        {highlights.map((hl, idx) => (
          <motion.div 
            key={hl.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.15, duration: 0.3 }}
            className="flex items-start gap-3 bg-[var(--color-canvas-soft-2)] p-3 rounded-lg border border-[var(--color-hairline)]/80 shadow-sm"
          >
            <div className="mt-0.5 bg-[var(--color-canvas)] p-1.5 rounded-md border border-[var(--color-hairline)] shrink-0">
              <HighlightIcon category={hl.category} />
            </div>
            <div className="text-[var(--color-mute)] text-xs leading-relaxed font-medium">
              {hl.text}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

function MatchCard({ match, delay, isFinal = false }: { match: PlayoffMatch, delay: number, isFinal?: boolean }) {
  if (!match) return null;
  const t1Winner = match.winner === match.team1;
  const t2Winner = match.winner === match.team2;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute w-[220px] rounded-xl overflow-hidden backdrop-blur-md shadow-xl border ${isFinal ? 'border-[var(--color-gold)]/60 shadow-[0_0_25px_rgba(245,200,66,0.25)] bg-gradient-to-br from-[var(--color-warning-deep)]/30 to-[var(--color-canvas)]' : 'border-[var(--color-hairline)]/60 bg-[var(--color-canvas-soft-2)]/90 hover:bg-[var(--color-canvas)]'}`}
    >
      <div className={`text-[10px] font-semibold tracking-tight uppercase tracking-widest text-center py-1.5 ${isFinal ? 'bg-gradient-to-r from-[var(--color-gold-dim)] to-[var(--color-gold)] text-black shadow-md' : 'bg-[var(--color-canvas)] text-[var(--color-mute)] border-b border-[var(--color-hairline)]'}`}>
        {match.name}
      </div>
      <div className="p-3">
        {/* Team 1 */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full shadow-sm" style={{ background: teamColor(match.team1) }} />
            <span className={`font-semibold tracking-tight text-sm ${t1Winner ? 'text-[var(--color-ink)]' : 'text-[var(--color-mute)]'}`}>{match.team1}</span>
          </div>
          <span className={`font-mono font-bold text-xs ${t1Winner ? 'text-[var(--color-ink)]' : 'text-[var(--color-mute)]'}`}>{match.team1Score || '-'}</span>
        </div>
        {/* Team 2 */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full shadow-sm" style={{ background: teamColor(match.team2) }} />
            <span className={`font-semibold tracking-tight text-sm ${t2Winner ? 'text-[var(--color-ink)]' : 'text-[var(--color-mute)]'}`}>{match.team2}</span>
          </div>
          <span className={`font-mono font-bold text-xs ${t2Winner ? 'text-[var(--color-ink)]' : 'text-[var(--color-mute)]'}`}>{match.team2Score || '-'}</span>
        </div>
        
        {/* Result & MOTM */}
        <div className="border-t border-[var(--color-hairline)]/60 pt-2 flex flex-col gap-1.5">
          <div className="text-[9px] font-semibold tracking-tight text-green-400 uppercase text-center tracking-wider">{match.result}</div>
          {match.motm && (
            <div className="text-[9px] text-[var(--color-mute)] font-medium text-center flex items-center justify-center gap-1 bg-[var(--color-canvas-soft)] py-1 rounded">
              <span className="text-[var(--color-gold)] text-[10px]">⭐</span> {match.motm.player.name.split(' ').pop()} {match.motm.summary}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function PlayoffBracket({ matches }: { matches: PlayoffMatch[] }) {
  if (matches.length < 4) return null;
  const [q1, elim, q2, final] = matches;
  
  // Coordinates for SVG paths and Card placement
  // X: Col1=20, Col2=300, Col3=580
  // Y: Q1=30, Elim=250, Q2=190, Final=110
  
  return (
    <div className="relative w-full overflow-x-auto custom-scrollbar">
      <div className="relative min-w-[820px] h-[400px] my-4 bg-[var(--color-canvas-soft-2)] rounded-2xl border border-[var(--color-hairline)]/50 overflow-hidden">
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* SVG Connector Lines */}
        <svg className="absolute inset-0 pointer-events-none w-full h-full" style={{ zIndex: 0 }}>
          <defs>
            <linearGradient id="q1ToFinal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-hairline-strong)" />
              <stop offset="100%" stopColor="var(--color-gold)" />
            </linearGradient>
            <linearGradient id="q2ToFinal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-hairline-strong)" />
              <stop offset="100%" stopColor="var(--color-gold)" />
            </linearGradient>
          </defs>

          {/* Q1 to Q2 (Loser) */}
          <motion.path 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            d="M 240 90 L 270 90 L 270 250 L 300 250" 
            fill="none" stroke="var(--color-hairline-strong)" strokeWidth="2" strokeDasharray="4 4" 
          />
          {/* Elim to Q2 (Winner) */}
          <motion.path 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            d="M 240 310 L 270 310 L 270 250" 
            fill="none" stroke="var(--color-hairline-strong)" strokeWidth="2" 
          />
          {/* Q2 to Final (Winner) */}
          <motion.path 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 2.0 }}
            d="M 520 250 L 550 250 L 550 170 L 580 170" 
            fill="none" stroke="url(#q2ToFinal)" strokeWidth="2" 
          />
          {/* Q1 to Final (Winner) */}
          <motion.path 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
            d="M 240 90 L 550 90 L 550 170" 
            fill="none" stroke="url(#q1ToFinal)" strokeWidth="2" 
          />
        </svg>

        {/* Cards */}
        <div style={{ top: 30, left: 20 }} className="absolute z-10">
          <MatchCard match={q1} delay={0.2} />
        </div>
        
        <div style={{ top: 250, left: 20 }} className="absolute z-10">
          <MatchCard match={elim} delay={0.6} />
        </div>
        
        <div style={{ top: 190, left: 300 }} className="absolute z-10">
          <MatchCard match={q2} delay={1.4} />
        </div>
        
        <div style={{ top: 110, left: 580 }} className="absolute z-10">
          <MatchCard match={final} delay={2.2} isFinal />
          {/* Trophy Animation */}
          <motion.div 
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 2.8, type: 'spring', bounce: 0.6, duration: 1 }}
            className="absolute -top-14 left-1/2 -translate-x-1/2 text-5xl drop-shadow-[0_0_20px_rgba(234,179,8,1)] z-20"
          >
            🏆
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function PlayerStatsTable({ squad, stats, playerForms }: {
  squad: SquadSlot[];
  stats: Record<number, PlayerStats>;
  playerForms?: Record<number, PlayerForm>;
}) {
  const players = squad.filter(s => s.player).map(s => s.player!);
  return (
    <div className="card mb-6 overflow-hidden">
      <details className="group">
        <summary className="p-4 cursor-pointer font-bold text-[var(--color-mute)] hover:text-[var(--color-ink)] flex justify-between items-center bg-[var(--color-canvas)] select-none">
          <span className="text-sm uppercase tracking-wider">Player Stats &amp; Form</span>
          <span className="text-xl group-open:rotate-180 transition-transform text-[var(--color-mute)]">▾</span>
        </summary>
        <div className="border-t border-[var(--color-hairline)] bg-[var(--color-canvas-soft-2)]">
          <div className="divide-y divide-[var(--color-hairline)]">
            {players.map(p => {
              const st = stats[p.id];
              const form = playerForms?.[p.id];
              const isBatter = p.role === 'BAT' || p.role === 'WK' || p.role === 'BAT_AR';
              const isBowler = p.role === 'BOWL' || p.role === 'BOWL_AR';
              return (
                <div key={p.id} className="px-4 py-3 hover:bg-[var(--color-canvas)] transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Stats summary */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] text-[var(--color-mute)] font-bold uppercase shrink-0">{p.role}</span>
                        <span className="text-sm font-bold text-[var(--color-ink)] truncate">{p.name}</span>
                      </div>
                      {/* Stat pills */}
                      <div className="flex flex-wrap gap-2 mb-1">
                        {(isBatter || p.role === 'AR' || p.role === 'BAT_AR' || p.role === 'BOWL_AR') && (
                          <>
                            <span className="text-[10px] font-mono bg-[var(--color-gold)]/10 text-[var(--color-gold-dim)] px-2 py-0.5 rounded">{st.runs} runs</span>
                            <span className="text-[10px] font-mono bg-[var(--color-canvas)] text-[var(--color-mute)] px-2 py-0.5 rounded">SR {st.strikeRate}</span>
                          </>
                        )}
                        {(isBowler || p.role === 'AR' || p.role === 'BAT_AR' || p.role === 'BOWL_AR') && st.wickets > 0 && (
                          <>
                            <span className="text-[10px] font-mono bg-[var(--color-win)]/10 text-[var(--color-win)] px-2 py-0.5 rounded">{st.wickets} wkts</span>
                            {st.economy > 0 && <span className="text-[10px] font-mono bg-[var(--color-canvas)] text-[var(--color-mute)] px-2 py-0.5 rounded">Eco {st.economy}</span>}
                          </>
                        )}
                      </div>
                      {/* Inline form */}
                      <PlayerFormInline form={form} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </details>
    </div>
  );
}


// ─── Full Control Season Screen ──────────────────────────────────
function FullControlSeasonScreen({
  fixtures,
  teams,
  squad,
  playersPool,
  initialForms,
  onComplete,
  settings,
}: {
  fixtures: [number, number][];
  teams: SeasonTeam[];
  squad: SquadSlot[];
  playersPool: Player[];
  initialForms: Record<number, PlayerForm>;
  onComplete: (teams: SeasonTeam[], results: MatchResult[], forms: Record<number, PlayerForm>, stats: Record<number, PlayerStats>, finalSquad: SquadSlot[]) => void;
  settings: GameSettings;
}) {
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [liveTeams, setLiveTeams] = useState<SeasonTeam[]>(() => JSON.parse(JSON.stringify(teams)));
  const [history, setHistory] = useState<MatchResult[]>([]);
  const [forms, setForms] = useState<Record<number, PlayerForm>>(initialForms);
  const [seasonStats, setSeasonStats] = useState<Record<number, PlayerStats>>({});
  const [currentSquad, setCurrentSquad] = useState<SquadSlot[]>(() => JSON.parse(JSON.stringify(squad)));
  const [lastUserResult, setLastUserResult] = useState<MatchResult | null>(null);

  const total = fixtures.length;

  useEffect(() => {
    if (currentMatchIdx >= total) {
      onComplete(liveTeams, history, forms, seasonStats, currentSquad);
      return;
    }

    if (lastUserResult) return;

    const [a, b] = fixtures[currentMatchIdx];
    const isUserMatch = liveTeams[a].short === 'YOUR XI' || liveTeams[b].short === 'YOUR XI';

    if (!isUserMatch) {
      // Small timeout to allow UI to breathe
      const timer = setTimeout(() => {
        const res = simulateMatch(liveTeams[a], liveTeams[b], playersPool, currentSquad, forms);
        applyResult(liveTeams, a, b, res);
        accumulateStats(seasonStats, res.matchStats);
        
        setHistory(prev => [...prev, res]);
        setLiveTeams([...liveTeams]);
        setCurrentMatchIdx(currentMatchIdx + 1);
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [currentMatchIdx, total, liveTeams, fixtures, playersPool, currentSquad, forms, seasonStats, lastUserResult, onComplete]);

  const [a, b] = currentMatchIdx < total ? fixtures[currentMatchIdx] : [0, 0];
  const isUserMatch = currentMatchIdx < total && (liveTeams[a].short === 'YOUR XI' || liveTeams[b].short === 'YOUR XI');

  if (currentMatchIdx >= total) {
    return <div className="min-h-screen flex items-center justify-center text-[var(--color-mute)] font-mono text-sm uppercase tracking-widest animate-pulse">Finishing Season...</div>;
  }

  if (lastUserResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
        <div className="card p-8 max-w-lg w-full flex flex-col items-center border-2 border-yellow-900/30 text-center shadow-2xl">
          <div className="text-sm font-bold text-[var(--color-mute)] uppercase tracking-widest mb-2">Match {currentMatchIdx} Result</div>
          <div className={`text-3xl font-semibold tracking-tight mb-6 ${lastUserResult.userWon ? 'text-green-400' : 'text-red-400'}`}>
            {lastUserResult.userWon ? 'VICTORY' : 'DEFEAT'}
          </div>
          <div className="text-xl font-semibold tracking-tight text-[var(--color-ink)] mb-2">{lastUserResult.winner} won {lastUserResult.margin}</div>
          <div className="flex gap-4 mb-6 w-full justify-center text-xl font-mono text-[var(--color-mute)] bg-[var(--color-canvas-soft-2)] p-4 rounded-xl border border-[var(--color-hairline)]">
             <div className="flex-1 text-right">{lastUserResult.homeScore}</div>
             <div className="text-gray-600 font-bold">VS</div>
             <div className="flex-1 text-left">{lastUserResult.awayScore}</div>
          </div>
          {lastUserResult.motm && (
             <div className="text-sm font-bold text-yellow-500 mb-8 flex items-center gap-2 bg-yellow-900/20 px-4 py-3 rounded-xl border border-yellow-900/50">
                ⭐ {lastUserResult.motm.player.name} - {lastUserResult.motm.summary}
             </div>
          )}
          <button 
             onClick={() => setLastUserResult(null)}
             className="btn-primary w-full py-4 text-lg"
          >
             Continue Season
          </button>
        </div>
      </div>
    );
  }

  if (isUserMatch) {
    const opponent = liveTeams[a].short === 'YOUR XI' ? liveTeams[b] : liveTeams[a];
    return (
      <MatchPrepScreen 
        squad={currentSquad}
        opponent={opponent}
        matchIdx={currentMatchIdx}
        totalMatches={total}
        playerForms={forms}
        settings={settings}
        onSimulateMatch={(playingXI, impactBench, updatedSquad) => {
          const res = simulateMatch(liveTeams[a], liveTeams[b], playersPool, updatedSquad, forms, { playingXI, impactBench });
          applyResult(liveTeams, a, b, res);
          accumulateStats(seasonStats, res.matchStats);
          
          let newForms = { ...forms };
          newForms = updateAllForms(newForms, updatedSquad, res.userWon, res.motm?.player.id);
          setForms(newForms);

          setCurrentSquad(updatedSquad);
          setHistory(prev => [...prev, res]);
          setLiveTeams([...liveTeams]);
          setCurrentMatchIdx(currentMatchIdx + 1);
          setLastUserResult(res);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-[var(--color-mute)] font-bold text-xl mb-4 animate-pulse">
          Simulating around the league...
        </div>
        <div className="text-xs text-gray-600 uppercase tracking-widest">
          Match {currentMatchIdx + 1} of {total}
        </div>
      </div>
    </div>
  );
}

function LiveStatsPanel({ stats, isFinal }: { stats: Record<number, PlayerStats>, isFinal?: boolean }) {
  const players = Object.values(stats);
  const orangeCap = [...players].sort((a, b) => (b.runs || 0) - (a.runs || 0)).slice(0, 3);
  const purpleCap = [...players].sort((a, b) => (b.wickets || 0) - (a.wickets || 0)).slice(0, 3);
  const mvp = [...players].sort((a, b) => (b.mvpScore || 0) - (a.mvpScore || 0)).slice(0, 3);

  const THEMES = {
    orange: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
    purple: { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
    yellow: { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" }
  };

  const StatRow = ({ title, icon, color, data, valKey }: any) => {
    const theme = THEMES[color as keyof typeof THEMES];
    return (
      <div className="mb-6 last:mb-0">
        <div className="flex items-center gap-2 mb-3">
          <span className={theme.text}>{icon}</span>
          <h4 className={`text-sm font-semibold tracking-tight uppercase tracking-widest ${theme.text}`}>{title}</h4>
        </div>
        <div className="space-y-2">
          {data.map((p: any, i: number) => (
            <div key={i} className={`flex items-center justify-between p-2 rounded-lg border ${p.isUserTeam ? `${theme.bg} ${theme.border}` : 'bg-[var(--color-canvas)] border-[var(--color-hairline)]'}`}>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold tracking-tight ${i === 0 ? theme.text : 'text-[var(--color-mute)]'}`}>#{i + 1}</span>
                <div>
                  <div className={`text-xs font-bold text-[var(--color-ink)]`}>{p.name}</div>
                  <div className="text-[9px] text-[var(--color-mute)] uppercase flex items-center gap-1 mt-0.5 font-bold">
                    {p.team}
                    {p.isUserTeam && <span className="text-[var(--color-primary)] tracking-wider font-bold border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-1 py-[1px] rounded leading-none text-[8px]">YOUR XI</span>}
                  </div>
                </div>
              </div>
              <div className={`text-sm font-semibold tracking-tight ${theme.text}`}>{valKey === 'strikeRate' ? p[valKey].toFixed(1) : p[valKey]}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="card p-5 border border-[var(--color-hairline)] bg-[var(--color-canvas-soft-2)] h-full overflow-y-auto custom-scrollbar shadow-sm">
      <div className="text-xs text-[var(--color-mute)] font-bold uppercase tracking-widest mb-4 border-b border-[var(--color-hairline)] pb-3">
        {isFinal ? 'Final Season Leaders' : 'Live Tournament Leaders'}
      </div>
      {orangeCap.length > 0 ? (
        <>
          <StatRow title="Orange Cap (Runs)" icon="🏏" color="orange" data={orangeCap} valKey="runs" />
          <StatRow title="Purple Cap (Wickets)" icon="🎯" color="purple" data={purpleCap} valKey="wickets" />
          <StatRow title="Season MVP (Impact)" icon="⭐" color="yellow" data={mvp} valKey="mvpScore" />
        </>
      ) : (
        <div className="text-sm text-[var(--color-mute)] text-center py-8">Stats will appear after matches.</div>
      )}
    </div>
  );
}

function SimpleSquadBuilder({
  squad,
  onSubmit,
  settings
}: {
  squad: SquadSlot[];
  onSubmit: (playingXI: Player[], impactBench: Player[], updatedSquad: SquadSlot[]) => void;
  settings?: GameSettings;
}) {
  const allPlayers = squad.filter(s => s.player).map(s => s.player!);
  const initialXI = squad.filter(s => s.player && s.position !== 'BENCH').map(s => s.player!);
  const initialBench = squad.filter(s => s.player && s.position === 'BENCH').map(s => s.player!);

  const [playingXI, setPlayingXI] = useState<Player[]>(initialXI.length > 0 ? initialXI.slice(0, 11) : []);
  const [impactBench, setImpactBench] = useState<Player[]>(initialBench.length > 0 ? initialBench.slice(0, 5) : []);

  const handlePlayerClick = (p: Player) => {
    const inXI = playingXI.find(x => x.id === p.id);
    const inBench = impactBench.find(x => x.id === p.id);

    if (inXI) {
      setPlayingXI(playingXI.filter(x => x.id !== p.id));
    } else if (inBench) {
      setImpactBench(impactBench.filter(x => x.id !== p.id));
    } else {
      if (playingXI.length < 11) {
        setPlayingXI([...playingXI, p]);
      } else if (impactBench.length < 5) {
        setImpactBench([...impactBench, p]);
      }
    }
  };

  const handleSubmit = () => {
    const newSquad: SquadSlot[] = squad.map(s => ({ ...s, player: null }));
    let xiIdx = 0;
    let benchIdx = 0;
    
    for (let i = 0; i < newSquad.length; i++) {
      if (newSquad[i].position !== 'BENCH' && xiIdx < playingXI.length) {
        newSquad[i].player = playingXI[xiIdx];
        xiIdx++;
      } else if (newSquad[i].position === 'BENCH' && benchIdx < impactBench.length) {
        newSquad[i].player = impactBench[benchIdx];
        benchIdx++;
      }
    }
    
    const usedIds = new Set([...playingXI.map(p => p.id), ...impactBench.map(p => p.id)]);
    const remaining = allPlayers.filter(p => !usedIds.has(p.id));
    for (let i = 0; i < newSquad.length; i++) {
      if (newSquad[i].position === 'BENCH' && !newSquad[i].player && remaining.length > 0) {
        newSquad[i].player = remaining.shift() || null;
      }
    }

    onSubmit(playingXI, impactBench, newSquad);
  };

  const overseasCount = playingXI.filter(p => p.is_overseas).length;
  const isReady = playingXI.length === 11 && impactBench.length === 5 && overseasCount <= 4;

  return (
    <div className="card p-5 border-2 border-yellow-900/30 flex flex-col h-full bg-[var(--color-canvas-soft-2)] max-h-[600px]">
      <div className="text-xs text-yellow-500 font-bold uppercase tracking-widest mb-4 border-b border-[var(--color-hairline)] pb-2">
        Select Match Squad
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar mb-4">
        <div className="text-[10px] font-mono text-[var(--color-mute)] uppercase tracking-widest font-bold mb-2">Available Players</div>
        <div className="grid grid-cols-2 gap-2">
          {allPlayers.map(p => {
            const inXI = playingXI.find(x => x.id === p.id);
            const inBench = impactBench.find(x => x.id === p.id);
            const status = inXI ? 'XI' : inBench ? 'BENCH' : '';
            return (
              <div 
                key={p.id} 
                onClick={() => handlePlayerClick(p)}
                className={`p-2 rounded-lg border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                  inXI ? 'border-green-500/50 bg-green-900/20' : 
                  inBench ? 'border-blue-500/50 bg-blue-900/20' : 
                  'border-[var(--color-hairline)] bg-[var(--color-canvas)] hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${inXI ? 'text-green-400' : inBench ? 'text-blue-400' : 'text-[var(--color-mute)]'} truncate max-w-[100px]`}>
                    {p.name} {p.is_overseas && '✈️'}
                  </span>
                </div>
                {status && (
                  <span className={`text-[9px] font-semibold tracking-tight uppercase tracking-wider ${inXI ? 'text-green-500' : 'text-blue-500'}`}>
                    {status}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center text-[10px] text-[var(--color-mute)] uppercase font-bold mb-4 tracking-widest px-2">
        <div>Playing XI: <span className={playingXI.length === 11 ? 'text-green-400' : 'text-yellow-400'}>{playingXI.length}/11</span></div>
        <div>Impact Bench: <span className={impactBench.length === 5 ? 'text-blue-400' : 'text-yellow-400'}>{impactBench.length}/5</span></div>
        <div>Overseas: <span className={overseasCount <= 4 ? 'text-[var(--color-mute)]' : 'text-red-400'}>{overseasCount}/4</span></div>
      </div>

      <button
        disabled={!isReady}
        onClick={handleSubmit}
        className={`w-full py-4 rounded-xl font-semibold tracking-tight text-sm uppercase tracking-widest transition-all ${
          isReady ? 'btn-primary pulse-gold' : 'bg-[var(--color-canvas)] text-[var(--color-mute)] cursor-not-allowed border border-[var(--color-hairline)]'
        }`}
      >
        Submit Squad
      </button>
    </div>
  );
}

function WatchModeScreen({
  fixtures,
  teams,
  squad,
  playersPool,
  initialForms,
  onComplete,
  onSkip,
  control = 'ai',
  settings,
}: {
  fixtures: [number, number][];
  teams: SeasonTeam[];
  squad: SquadSlot[];
  playersPool: Player[];
  initialForms: Record<number, PlayerForm>;
  onComplete: (teams: SeasonTeam[], results: MatchResult[], forms: Record<number, PlayerForm>, stats: Record<number, PlayerStats>, finalSquad?: SquadSlot[]) => void;
  onSkip: () => void;
  control?: 'ai' | 'full';
  settings?: GameSettings;
}) {
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [completedMatches, setCompletedMatches] = useState<MatchResult[]>([]);
  const [liveTeams, setLiveTeams] = useState<SeasonTeam[]>(() => JSON.parse(JSON.stringify(teams)));
  const [currentResult, setCurrentResult] = useState<MatchResult | null>(null);
  const [isDone, setIsDone] = useState(false);
  
  const [isPaused, setIsPaused] = useState(control === 'full');
  const [showSquadBuilder, setShowSquadBuilder] = useState(control === 'full');
  const [actionDoneForMatch, setActionDoneForMatch] = useState<number>(-1);
  const [localSquad, setLocalSquad] = useState<SquadSlot[]>(() => JSON.parse(JSON.stringify(squad)));
  const [playingXI, setPlayingXI] = useState<Player[]>([]);
  const [impactBench, setImpactBench] = useState<Player[]>([]);
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teamsRef = useRef<SeasonTeam[]>(JSON.parse(JSON.stringify(teams)));
  const historyRef = useRef<MatchResult[]>([]);
  const formsRef = useRef<Record<number, PlayerForm>>(initialForms);
  const seasonStatsRef = useRef<Record<number, PlayerStats>>({});
  
  const [liveForms, setLiveForms] = useState<Record<number, PlayerForm>>(initialForms);
  const [liveSeasonStats, setLiveSeasonStats] = useState<Record<number, PlayerStats>>({});

  const total = fixtures.length;

  const handleSquadSubmit = (xi: Player[], bench: Player[], newSquad: SquadSlot[]) => {
    setPlayingXI(xi);
    setImpactBench(bench);
    setLocalSquad(newSquad);
    setShowSquadBuilder(false);
    setActionDoneForMatch(currentMatchIdx);
    setIsPaused(false);
  };

  const advanceMatch = useCallback(() => {
    const idx = currentMatchIdx;
    if (idx >= fixtures.length) {
      setIsDone(true);
      onComplete(teamsRef.current, historyRef.current, formsRef.current, seasonStatsRef.current, localSquad);
      return;
    }
    const [a, b] = fixtures[idx];
    const isUserMatch = teamsRef.current[a].short === 'YOUR XI' || teamsRef.current[b].short === 'YOUR XI';

    if (control === 'full' && isUserMatch && actionDoneForMatch !== idx) {
      setIsPaused(true);
      return;
    }

    let matchPrepConfig;
    if (control === 'full' && isUserMatch) {
      matchPrepConfig = { playingXI, impactBench };
    }

    const res = simulateMatch(teamsRef.current[a], teamsRef.current[b], playersPool, localSquad, formsRef.current, matchPrepConfig);
    applyResult(teamsRef.current, a, b, res);
    
    accumulateStats(seasonStatsRef.current, res.matchStats);
    setLiveSeasonStats({ ...seasonStatsRef.current });

    historyRef.current = [...historyRef.current, res];
    setCompletedMatches([...historyRef.current]);
    setLiveTeams(JSON.parse(JSON.stringify(teamsRef.current)));
    
    if (res.isUserMatch) {
      const motmId = res.motm?.player.id;
      formsRef.current = updateAllForms(formsRef.current, localSquad, res.userWon, motmId);
      setLiveForms({ ...formsRef.current });
      setCurrentResult(res);
    } else {
      setCurrentResult(null);
    }
    setCurrentMatchIdx(idx + 1);
  }, [currentMatchIdx, fixtures, playersPool, localSquad, onComplete, control, actionDoneForMatch, playingXI, impactBench]);

  useEffect(() => {
    if (isPaused || isDone || currentMatchIdx >= total) return;
    
    const lastMatchUser = currentMatchIdx > 0 && historyRef.current[currentMatchIdx - 1]?.isUserMatch;
    const delay = currentMatchIdx === 0 ? 400 : (lastMatchUser ? 1200 : 150);
    
    timerRef.current = setTimeout(() => {
      advanceMatch();
    }, delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [currentMatchIdx, isPaused, isDone, advanceMatch, total]);

  const isWaitingForUser = isPaused && control === 'full' && currentMatchIdx < total && 
     (liveTeams[fixtures[currentMatchIdx][0]].short === 'YOUR XI' || liveTeams[fixtures[currentMatchIdx][1]].short === 'YOUR XI') && 
     actionDoneForMatch !== currentMatchIdx;

  const sortedLive = [...liveTeams].sort((a, b) => b.points - a.points || b.nrr - a.nrr);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-[1600px] mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[var(--color-canvas)]/60 backdrop-blur-md p-6 rounded-2xl border border-[var(--color-hairline)] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)]">
        <div>
          <div className="text-xs text-[var(--color-primary)] uppercase tracking-widest font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" /> Watch Mode
          </div>
          <div className="text-3xl font-black tracking-tighter text-[var(--color-ink)] mt-1">
            Match <span className="text-yellow-400">{Math.min(currentMatchIdx, total)}</span>
            <span className="text-[var(--color-mute)] text-xl font-medium tracking-tight"> / {total}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-full md:w-64 h-3 bg-[var(--color-canvas-soft-2)] rounded-full overflow-hidden border border-[var(--color-hairline)] shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-500 to-[var(--color-primary)] rounded-full"
              animate={{ width: `${(currentMatchIdx / total) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl border transition-all shadow-sm shrink-0 ${
              isPaused 
                ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/20' 
                : 'bg-[var(--color-canvas)] text-[var(--color-mute)] border-[var(--color-hairline)] hover:bg-[var(--color-canvas-soft-2)]'
            }`}
          >
            {isPaused ? <><Play size={16} /> Resume</> : <><Pause size={16} /> Pause</>}
          </button>

          <button
            onClick={() => {
              if (timerRef.current) clearTimeout(timerRef.current);
              onSkip();
            }}
            className="text-sm font-bold text-[var(--color-mute)] hover:text-[var(--color-ink)] border border-[var(--color-hairline)] hover:border-gray-500 px-5 py-2.5 rounded-xl transition-all bg-[var(--color-canvas)] shrink-0 shadow-sm"
          >
            ⏭ Skip to End
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Current Match & Recent (Span 4) */}
        <div className="space-y-4 lg:col-span-4">
          {showSquadBuilder ? (
            <SimpleSquadBuilder squad={localSquad} onSubmit={handleSquadSubmit} settings={settings} />
          ) : isWaitingForUser ? (
             <div className="card p-5 border-2 border-yellow-500/50 bg-yellow-900/10 shadow-2xl">
               <div className="text-xs text-yellow-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                 Your Match is Next
               </div>
               <div className="text-xl font-semibold tracking-tight text-[var(--color-ink)] mb-6 bg-black/40 p-4 rounded-xl border border-[var(--color-hairline)] text-center flex flex-col gap-2">
                 <span className="text-yellow-400 tracking-widest">YOUR XI</span>
                 <span className="text-gray-600 text-xs font-bold">VS</span>
                 <span className="text-[var(--color-mute)]">{liveTeams[fixtures[currentMatchIdx][0]].short === 'YOUR XI' ? liveTeams[fixtures[currentMatchIdx][1]].short : liveTeams[fixtures[currentMatchIdx][0]].short}</span>
               </div>
               <div className="flex flex-col gap-3">
                 <button onClick={() => { setActionDoneForMatch(currentMatchIdx); setIsPaused(false); }} className="btn-primary py-3 text-sm">
                   ▶ Continue with Same Team
                 </button>
                 <button onClick={() => setShowSquadBuilder(true)} className="btn-secondary py-3 text-sm">
                   Make Changes
                 </button>
               </div>
             </div>
          ) : (
            <AnimatePresence mode="wait">
              {currentResult && currentResult.isUserMatch ? (
                <motion.div
                  key={currentMatchIdx}
                initial={{ opacity: 0, y: -20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.35 }}
                className={`card p-5 border-2 ${
                  currentResult.rainEvent?.type === 'abandoned'
                    ? 'border-blue-700/60 bg-blue-950/20'
                    : currentResult.rainEvent?.type === 'dls_reduced'
                    ? 'border-teal-700/60 bg-teal-950/20'
                    : currentResult.userWon
                      ? 'border-green-600/60 bg-green-950/20'
                      : 'border-red-600/60 bg-red-950/20'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[10px] font-mono text-[var(--color-mute)] uppercase tracking-widest font-bold">
                    Match #{currentMatchIdx} — YOUR XI
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${currentResult.userWon ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      {currentResult.userWon ? '✓ YOUR XI WON' : '✗ YOUR XI LOST'}
                    </span>
                    {currentResult.rainEvent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900/50 text-blue-300">🌧 RAIN</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 text-right">
                    <div className={`text-sm font-semibold tracking-tight ${currentResult.winner === currentResult.homeTeam ? 'text-yellow-400' : 'text-[var(--color-mute)]'}`}>
                      {currentResult.homeTeam}
                    </div>
                    <div className="text-sm font-mono text-[var(--color-mute)] mt-1">{currentResult.homeScore}</div>
                  </div>
                  <div className="text-gray-600 font-bold text-xs tracking-widest px-2">VS</div>
                  <div className="flex-1">
                    <div className={`text-sm font-semibold tracking-tight ${currentResult.winner === currentResult.awayTeam ? 'text-yellow-400' : 'text-[var(--color-mute)]'}`}>
                      {currentResult.awayTeam}
                    </div>
                    <div className="text-sm font-mono text-[var(--color-mute)] mt-1">{currentResult.awayScore}</div>
                  </div>
                </div>

                {currentResult.rainEvent?.type !== 'abandoned' && (
                  <div className="text-center text-sm font-bold text-green-400">
                    {currentResult.winner} won {currentResult.margin}
                  </div>
                )}

                {currentResult.destinyTriggered && (
                  <div className="mt-3 flex justify-center text-center">
                    <span className="text-xs font-bold px-3 py-1 bg-yellow-500 text-black rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                      ⭐ THE UNTHINKABLE! Perfect Season Destiny Saved!
                    </span>
                  </div>
                )}

                {currentResult.clutchTriggered && (
                  <div className="mt-2 flex justify-center text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 border border-red-500/50 text-red-400 rounded bg-red-950/50 uppercase tracking-widest">
                      ⚡ {currentResult.clutchTriggered} Delivers Under Pressure!
                    </span>
                  </div>
                )}

                {(currentResult.momentumStateA || currentResult.momentumStateB) && (
                  <div className="mt-2 flex flex-col gap-1 items-center">
                    {currentResult.momentumStateA && <span className="text-[9px] font-bold px-2 py-0.5 bg-orange-900/50 text-orange-400 rounded uppercase">🔥 {currentResult.homeTeam}: {currentResult.momentumStateA}</span>}
                    {currentResult.momentumStateB && <span className="text-[9px] font-bold px-2 py-0.5 bg-orange-900/50 text-orange-400 rounded uppercase">🔥 {currentResult.awayTeam}: {currentResult.momentumStateB}</span>}
                  </div>
                )}

                {currentResult.rainEvent && (
                  <div className="mt-3 flex justify-center">
                    <RainBadge event={currentResult.rainEvent} />
                  </div>
                )}

                {currentResult.motm && currentResult.rainEvent?.type !== 'abandoned' && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-3 bg-yellow-900/10 border border-yellow-900/30 p-2.5 rounded-xl">
                      <div className="w-9 h-9 bg-[var(--color-canvas)] border border-yellow-700/50 rounded-full flex items-center justify-center text-sm font-bold text-yellow-500 shrink-0">
                        {initials(currentResult.motm.player.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-yellow-400 text-xs font-semibold tracking-tight truncate">{currentResult.motm.player.name}</div>
                        <div className="text-[var(--color-mute)] text-[10px]">{currentResult.motm.summary}</div>
                        {liveForms[currentResult.motm.player.id] && (
                          <PlayerFormInline form={liveForms[currentResult.motm.player.id]} compact />
                        )}
                      </div>
                      <div className="text-sm font-semibold tracking-tight text-[var(--color-ink)] shrink-0">{currentResult.motm.rating.toFixed(1)}</div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : !isDone && (
              <motion.div
                key={`sim-${currentMatchIdx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card p-5 border border-[var(--color-hairline)] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse shrink-0" />
                  <div className="text-xs text-[var(--color-mute)] font-bold uppercase tracking-widest">
                    {isPaused ? 'Simulation Paused' : 'Simulating other matches...'}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          )}

          {completedMatches.length > 1 && (
            <div className="card p-4">
              <div className="text-[10px] font-mono text-[var(--color-mute)] uppercase tracking-widest font-bold mb-3">Recent Results</div>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                {[...completedMatches].reverse().slice(1, 10).map((m, i) => (
                  <div key={i} className={`flex items-center justify-between text-xs px-3 py-1.5 rounded-lg ${m.isUserMatch ? 'bg-yellow-900/10 border border-yellow-900/20' : 'bg-[var(--color-canvas)]'}`}>
                    <span className={`font-bold truncate max-w-[35%] ${m.winner === m.homeTeam ? 'text-gray-200' : 'text-[var(--color-mute)]'}`}>{m.homeTeam.split(' ').pop()}</span>
                    <span className="text-gray-600 text-[9px] px-2 font-mono">
                      {m.rainEvent?.type === 'abandoned' ? '🌧 NR' : m.homeScore.split(' ')[0]}
                    </span>
                    <span className="text-gray-600 text-[9px] px-2 font-mono">
                      {m.rainEvent?.type === 'abandoned' ? '' : m.awayScore.split(' ')[0]}
                    </span>
                    <span className={`font-bold truncate max-w-[35%] text-right ${m.winner === m.awayTeam ? 'text-gray-200' : 'text-[var(--color-mute)]'}`}>{m.awayTeam.split(' ').pop()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Middle: Live Table (Span 4) */}
        <div className="lg:col-span-4 bg-[var(--color-canvas)] rounded-2xl border border-[var(--color-hairline)] overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] flex flex-col h-full">
          <div className="p-5 font-bold text-[var(--color-ink)] bg-[var(--color-canvas-soft-2)] border-b border-[var(--color-hairline)] text-sm tracking-tight shrink-0 flex items-center justify-between">
            <span>Live Standings</span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--color-mute)]">{total - currentMatchIdx} Matches Left</span>
          </div>
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-canvas-soft)] border-b border-[var(--color-hairline)]">
                  <th className="py-3 pl-4 text-[10px] font-bold text-[var(--color-mute)] uppercase tracking-widest">Team</th>
                  <th className="py-3 px-2 text-[10px] font-bold text-[var(--color-mute)] uppercase text-center tracking-widest">P</th>
                  <th className="py-3 px-2 text-[10px] font-bold text-[var(--color-mute)] uppercase text-center tracking-widest">W</th>
                  <th className="py-3 px-2 text-[10px] font-bold text-[var(--color-mute)] uppercase text-center tracking-widest">L</th>
                  <th className="py-3 px-2 text-[10px] font-bold text-[var(--color-mute)] uppercase text-center tracking-widest">Pts</th>
                  <th className="py-3 pr-4 text-[10px] font-bold text-[var(--color-mute)] uppercase text-right tracking-widest">NRR</th>
                </tr>
              </thead>
              <tbody>
                {sortedLive.map((t, idx) => {
                  const isTop4 = idx < 4;
                  const isUser = t.short === 'YOUR XI';
                  return (
                    <tr key={t.short} className={`
                      border-b border-[var(--color-hairline)]/50 transition-colors
                      ${isUser ? 'bg-yellow-500/5 hover:bg-yellow-500/10' : 'hover:bg-[var(--color-canvas-soft-2)]'}
                      ${isTop4 && !isUser ? 'bg-green-500/5 hover:bg-green-500/10' : ''}
                      ${idx === 3 ? 'border-b-[var(--color-primary)] border-b-2' : ''}
                    `}>
                      <td className="py-2.5 pl-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-1 h-8 rounded-full ${isTop4 ? 'bg-[var(--color-success)]' : 'bg-transparent'}`} />
                          <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 shadow-sm" style={{ background: teamColor(t.short) }}>
                            <span className="text-[9px] font-bold tracking-tight text-white">{t.short.slice(0, 1)}</span>
                          </div>
                          <span className={`text-sm font-bold tracking-tight ${isUser ? 'text-yellow-400' : 'text-[var(--color-ink)]'}`}>
                            {t.short}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center text-xs font-mono font-medium text-[var(--color-mute)]">{t.played}</td>
                      <td className="py-2.5 px-2 text-center text-xs font-mono font-bold text-[var(--color-success)]">{t.won}</td>
                      <td className="py-2.5 px-2 text-center text-xs font-mono font-bold text-[var(--color-error)]">{t.lost}</td>
                      <td className={`py-2.5 px-2 text-center text-sm font-black tracking-tight font-mono ${isUser ? 'text-yellow-400' : 'text-[var(--color-ink)]'}`}>
                        {t.points}
                      </td>
                      <td className={`py-2.5 pr-4 text-right text-[11px] font-mono font-bold tracking-tighter ${t.nrr >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                        {t.nrr > 0 ? '+' : ''}{t.nrr.toFixed(3)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Leaderboards (Span 4) */}
        <div className="lg:col-span-4">
          <LiveStatsPanel stats={liveSeasonStats} />
        </div>
      </div>
    </div>
  );
}


function PlayoffsWatchScreen({
  top4,
  teams,
  squad,
  playersPool,
  initialForms,
  seasonStats,
  onComplete,
  settings,
}: {
  top4: SeasonTeam[];
  teams: SeasonTeam[];
  squad: SquadSlot[];
  playersPool: Player[];
  initialForms: Record<number, PlayerForm>;
  seasonStats: Record<number, PlayerStats>;
  onComplete: (playoffMatches: PlayoffMatch[], champion: string, finalSquad: SquadSlot[], finalForms: Record<number, PlayerForm>, finalStats: Record<number, PlayerStats>) => void;
  settings: GameSettings;
}) {
  const [matches, setMatches] = useState<PlayoffMatch[]>([]);
  const [step, setStep] = useState(0); // 0: Q1, 1: Elim, 2: Q2, 3: Final, 4: Done
  const [localSquad, setLocalSquad] = useState<SquadSlot[]>(() => JSON.parse(JSON.stringify(squad)));
  const [forms, setForms] = useState<Record<number, PlayerForm>>(initialForms);
  const [stats, setStats] = useState<Record<number, PlayerStats>>(seasonStats);

  const [q1Result, setQ1Result] = useState<{ winner: SeasonTeam, loser: SeasonTeam } | null>(null);
  const [elimResult, setElimResult] = useState<{ winner: SeasonTeam } | null>(null);
  const [q2Result, setQ2Result] = useState<{ winner: SeasonTeam } | null>(null);

  const [isFastForward, setIsFastForward] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [lastResult, setLastResult] = useState<MatchResult | null>(null);

  const currentMatchConfig = useMemo(() => {
    if (step === 0) return { name: 'Qualifier 1', t1: top4[0], t2: top4[1] };
    if (step === 1) return { name: 'Eliminator', t1: top4[2], t2: top4[3] };
    if (step === 2 && q1Result && elimResult) return { name: 'Qualifier 2', t1: q1Result.loser, t2: elimResult.winner };
    if (step === 3 && q1Result && q2Result) return { name: 'Final', t1: q1Result.winner, t2: q2Result.winner };
    return null;
  }, [step, top4, q1Result, elimResult, q2Result]);

  const isUserMatch = currentMatchConfig && (currentMatchConfig.t1.short === 'YOUR XI' || currentMatchConfig.t2.short === 'YOUR XI');

  useEffect(() => {
    if (step >= 4) {
      const champion = q1Result && q2Result ? (matches[3].winner) : top4[0].short;
      onComplete(matches, champion, localSquad, forms, stats);
      return;
    }

    if (!currentMatchConfig?.t1 || !currentMatchConfig?.t2) return;

    // Wait for user to acknowledge result before continuing
    if (lastResult) return;

    const isAutoControl = (settings.mode === 'franchise' && settings.franchiseControl === 'ai') || settings.mode === 'gamble';

    if (!isUserMatch || isFastForward || isAutoControl) {
      const timer = setTimeout(() => {
        simulatePlayoffMatch();
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      if (!showBuilder) {
         setShowBuilder(true);
      }
    }
  }, [step, isUserMatch, isFastForward, currentMatchConfig, lastResult, showBuilder]);

  const convertToPlayoffMatch = (res: MatchResult, name: string): PlayoffMatch => {
    return {
      name,
      team1: res.homeTeam,
      team2: res.awayTeam,
      team1Score: res.homeScore,
      team2Score: res.awayScore,
      winner: res.winner === res.homeTeam ? res.homeTeam : res.awayTeam,
      result: res.winner === 'No Result' ? res.margin : `${res.winner} won ${res.margin}`,
      motm: res.motm,
      highlights: res.highlights
    };
  };

  const simulatePlayoffMatch = (matchPrep?: MatchPrepConfig, newSquad?: SquadSlot[]) => {
    if (!currentMatchConfig?.t1 || !currentMatchConfig?.t2) return;
    const squadToUse = newSquad || localSquad;
    
    const prepToUse = matchPrep ? { ...matchPrep, isPlayoff: true } : { playingXI: [], impactBench: [], isPlayoff: true };
    // @ts-ignore (simulateMatch from engine)
    const res = simulateMatch(currentMatchConfig.t1, currentMatchConfig.t2, playersPool, squadToUse, forms, prepToUse);
    
    const pMatch = convertToPlayoffMatch(res, currentMatchConfig.name);
    const newMatches = [...matches, pMatch];
    setMatches(newMatches);

    if (res.matchStats) {
      const newStats = { ...stats };
      // @ts-ignore
      accumulateStats(newStats, res.matchStats);
      setStats(newStats);
    }
    
    if (res.isUserMatch) {
      // @ts-ignore
      const newForms = updateAllForms(forms, squadToUse, res.userWon, res.motm?.player.id);
      setForms(newForms);
      setLocalSquad(squadToUse);
    }

    const winnerTeam = res.winner === currentMatchConfig.t1.name ? currentMatchConfig.t1 : currentMatchConfig.t2;
    const loserTeam = res.winner === currentMatchConfig.t1.name ? currentMatchConfig.t2 : currentMatchConfig.t1;
    
    if (step === 0) setQ1Result({ winner: winnerTeam, loser: loserTeam });
    if (step === 1) setElimResult({ winner: winnerTeam });
    if (step === 2) setQ2Result({ winner: winnerTeam });

    if (res.isUserMatch) {
      setLastResult(res);
      if (!res.userWon && step !== 0) {
        setIsFastForward(true);
      }
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSquadSubmit = (xi: Player[], bench: Player[], newSquad: SquadSlot[]) => {
     setShowBuilder(false);
     simulatePlayoffMatch({ playingXI: xi, impactBench: bench }, newSquad);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-[1600px] mx-auto flex flex-col gap-8 bg-gradient-to-br from-[var(--color-canvas)] to-[var(--color-canvas-soft-2)] relative overflow-hidden">
       {/* Background effect */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-[var(--color-primary)] opacity-[0.03] rounded-full blur-[120px] pointer-events-none" />
       
       <div className="text-center mb-4 mt-6 z-10 relative">
         <div className="text-4xl md:text-5xl font-black tracking-tighter text-[var(--color-ink)] drop-shadow-sm">
           IPL <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-[var(--color-primary)]">PLAYOFFS</span>
         </div>
         <div className="text-sm md:text-base text-yellow-500 tracking-[0.2em] uppercase font-bold mt-2">The Road to the Trophy</div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 z-10">
         <div className="lg:col-span-3 flex flex-col gap-6">
           <div className="bg-[var(--color-canvas)]/60 backdrop-blur-xl rounded-2xl overflow-hidden shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] border border-[var(--color-hairline)]">
             <div className="p-4 bg-[var(--color-canvas-soft-2)] border-b border-[var(--color-hairline)] text-xs uppercase font-bold text-[var(--color-ink)] tracking-widest flex items-center justify-between">
               <span>Final Standings</span>
               <span className="text-[10px] text-[var(--color-mute)] bg-[var(--color-canvas)] px-2 py-0.5 rounded border border-[var(--color-hairline)]">TOP 4</span>
             </div>
             <table className="w-full text-left text-sm">
               <tbody>
                 {top4.map((t, i) => {
                   const isUser = t.short === 'YOUR XI';
                   return (
                     <tr key={t.short} className={`border-b border-[var(--color-hairline)]/50 last:border-0 transition-colors ${isUser ? 'bg-yellow-500/10' : 'hover:bg-[var(--color-canvas-soft-2)]'}`}>
                       <td className="p-4 w-12 text-center text-[var(--color-mute)] font-mono font-bold">{i+1}</td>
                       <td className={`p-4 truncate font-bold tracking-tight ${isUser ? 'text-yellow-400' : 'text-[var(--color-ink)]'}`}>
                         <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-sm flex items-center justify-center shrink-0" style={{ background: teamColor(t.short) }} />
                           {t.short}
                         </div>
                       </td>
                       <td className={`p-4 text-right font-mono font-black ${isUser ? 'text-yellow-400' : 'text-[var(--color-mute)]'}`}>{t.points}</td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>

           {isFastForward && (
             <div className="bg-red-500/10 backdrop-blur-md rounded-2xl p-6 border border-red-500/20 flex flex-col items-center justify-center text-center shadow-lg">
               <div className="text-4xl mb-4 animate-bounce">💔</div>
               <div className="text-lg font-black tracking-tight text-red-500 tracking-widest uppercase mb-2">Eliminated</div>
               <div className="text-xs text-[var(--color-mute)] font-medium">Simulating remaining matches...</div>
             </div>
           )}
         </div>

         <div className="lg:col-span-9 flex flex-col gap-6">
            <div className="bg-[var(--color-canvas)]/60 backdrop-blur-xl rounded-2xl p-6 md:p-8 flex-shrink-0 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] border border-[var(--color-hairline)] relative overflow-hidden">
               <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-500 to-[var(--color-primary)] opacity-50" />
               <div className="text-sm text-[var(--color-mute)] uppercase tracking-[0.15em] mb-8 text-center font-bold">Playoffs Bracket</div>
               <PlayoffBracket matches={[
                  matches[0] || { name: 'Qualifier 1', team1: top4[0].short, team2: top4[1].short, team1Score: '-', team2Score: '-', winner: '', result: 'Pending' },
                  matches[1] || { name: 'Eliminator', team1: top4[2].short, team2: top4[3].short, team1Score: '-', team2Score: '-', winner: '', result: 'Pending' },
                  matches[2] || { name: 'Qualifier 2', team1: q1Result?.loser.short || 'Loser Q1', team2: elimResult?.winner.short || 'Winner Elim', team1Score: '-', team2Score: '-', winner: '', result: 'Pending' },
                  matches[3] || { name: 'Final', team1: q1Result?.winner.short || 'Winner Q1', team2: q2Result?.winner.short || 'Winner Q2', team1Score: '-', team2Score: '-', winner: '', result: 'Pending' },
               ] as PlayoffMatch[]} />
            </div>

            <div className="flex-1 flex flex-col justify-center items-center py-4 md:py-8 min-h-[300px]">
               <AnimatePresence mode="wait">
                  {showBuilder ? (
                    <motion.div key="builder" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-3xl">
                       {/* @ts-ignore */}
                       <SimpleSquadBuilder squad={localSquad} onSubmit={handleSquadSubmit} settings={settings} />
                    </motion.div>
                  ) : lastResult ? (
                    <motion.div key="result" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-2xl relative group">
                       <div className={`absolute -inset-1 rounded-[2rem] blur-xl opacity-30 group-hover:opacity-50 transition duration-1000 ${lastResult.userWon ? 'bg-green-500' : 'bg-red-500'}`} />
                       <div className={`relative bg-[var(--color-canvas)] p-8 md:p-10 rounded-3xl border border-[var(--color-hairline)] shadow-2xl overflow-hidden`}>
                         <div className={`absolute top-0 inset-x-0 h-2 ${lastResult.userWon ? 'bg-[var(--color-success)]' : 'bg-[var(--color-error)]'}`} />
                         
                         <div className="text-center text-sm font-bold text-[var(--color-mute)] uppercase tracking-widest mb-8">
                           {currentMatchConfig?.name} Result
                         </div>
                         <div className="flex items-center gap-4 md:gap-8 mb-10">
                           <div className="flex-1 text-right flex flex-col items-end gap-1">
                             <div className={`text-3xl md:text-4xl font-black tracking-tighter ${lastResult.winner === lastResult.homeTeam ? 'text-[var(--color-ink)]' : 'text-[var(--color-mute)]'}`}>{lastResult.homeTeam}</div>
                             <div className="text-xl md:text-2xl font-mono font-bold text-[var(--color-mute)]">{lastResult.homeScore}</div>
                           </div>
                           <div className="text-[var(--color-mute)] font-black text-2xl md:text-3xl opacity-50">VS</div>
                           <div className="flex-1 text-left flex flex-col items-start gap-1">
                             <div className={`text-3xl md:text-4xl font-black tracking-tighter ${lastResult.winner === lastResult.awayTeam ? 'text-[var(--color-ink)]' : 'text-[var(--color-mute)]'}`}>{lastResult.awayTeam}</div>
                             <div className="text-xl md:text-2xl font-mono font-bold text-[var(--color-mute)]">{lastResult.awayScore}</div>
                           </div>
                         </div>
                         <div className="text-center font-black tracking-tight text-xl md:text-2xl text-[var(--color-primary)] mb-10">
                           {lastResult.winner} won {lastResult.margin}
                         </div>
                         <button onClick={() => { setLastResult(null); setStep(s => s + 1); }} className="w-full relative overflow-hidden rounded-2xl p-[2px] group/btn">
                           <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)] via-yellow-400 to-[var(--color-primary)] animate-shimmer bg-[length:200%_100%]" />
                           <div className="relative bg-[var(--color-canvas)] py-4 rounded-[14px] flex items-center justify-center gap-3 transition-colors group-hover/btn:bg-transparent">
                             <span className="font-bold text-lg text-[var(--color-ink)] group-hover/btn:text-black transition-colors tracking-widest uppercase">CONTINUE ▶</span>
                           </div>
                         </button>
                       </div>
                    </motion.div>
                  ) : (
                    <motion.div key="simulating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center gap-6 mt-12">
                       <div className="relative">
                         <div className="w-16 h-16 rounded-full border-4 border-yellow-500/20" />
                         <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-t-yellow-500 animate-spin" />
                       </div>
                       <div className="text-sm font-mono uppercase tracking-[0.2em] font-bold text-[var(--color-mute)] bg-[var(--color-canvas-soft-2)] px-4 py-2 rounded-lg border border-[var(--color-hairline)] shadow-inner">
                         Simulating {currentMatchConfig?.name || '...'}
                       </div>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>
         </div>
       </div>
    </div>
  );
}

function NavBar({ currentPhase, onNavigate }: { currentPhase: GamePhase, onNavigate: (p: GamePhase) => void }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[var(--color-canvas)]/80 backdrop-blur-md border-b border-[var(--color-hairline)] px-4 sm:px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-6">
        <button onClick={() => onNavigate('home')} className="text-[var(--color-ink)] font-semibold tracking-tight text-xl tracking-tighter hover:opacity-80 transition-opacity">
          16-0
        </button>
        <div className="hidden sm:flex items-center gap-1">
          <button 
            onClick={() => onNavigate('home')}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${currentPhase === 'home' ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold' : 'text-[var(--color-body)] hover:bg-[var(--color-canvas-soft-2)] font-medium'}`}
          >
            Home
          </button>
          <button 
            onClick={() => onNavigate('mode-select')}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${currentPhase === 'mode-select' || currentPhase === 'draft' || currentPhase === 'watching' ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold' : 'text-[var(--color-body)] hover:bg-[var(--color-canvas-soft-2)] font-medium'}`}
          >
            Play
          </button>
          <button 
            onClick={() => onNavigate('leaderboard')}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${currentPhase === 'leaderboard' ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold' : 'text-[var(--color-body)] hover:bg-[var(--color-canvas-soft-2)] font-medium'}`}
          >
            Leaderboard
          </button>
        </div>
      </div>
    </nav>
  );
}

function MainAppContent() {
  const [phase, setPhaseState] = useState<GamePhase>('home');
  const [lastActivePhase, setLastActivePhase] = useState<GamePhase | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('phase') as GamePhase;
    if (p) {
      setPhaseState(p);
    }
  }, []);

  useEffect(() => {
    const el = document.getElementById('home-only-content');
    if (el) {
      el.style.display = phase === 'home' ? 'block' : 'none';
    }
  }, [phase]);

  const setPhase = (newPhase: GamePhase) => {
    if (newPhase !== 'home' && newPhase !== 'leaderboard') {
      setLastActivePhase(newPhase);
    }
    setPhaseState(newPhase);
    const url = new URL(window.location.href);
    if (newPhase === 'home') {
      url.searchParams.delete('phase');
    } else {
      url.searchParams.set('phase', newPhase);
    }
    window.history.pushState({}, '', url);
  };
  const [squad, setSquad] = useState<SquadSlot[]>([]);
  const [rerolls, setRerolls] = useState(1);
  const [pickedNames, setPickedNames] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<GameSettings>({ difficulty: 'normal', showRatings: 'on', simSpeed: 'fast', mode: 'classic' });
  const [playersPool, setPlayersPool] = useState<Player[]>([]);
  const [results, setResults] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [playerForms, setPlayerForms] = useState<Record<number, PlayerForm>>({});
  const [playoffsData, setPlayoffsData] = useState<{
    top4: SeasonTeam[];
    teams: SeasonTeam[];
    leagueMatches: MatchResult[];
    forms: Record<number, PlayerForm>;
    stats: Record<number, PlayerStats>;
    squad: SquadSlot[];
  } | null>(null);

  useEffect(() => {
    fetch('/players.json').then(r => r.json()).then(data => setPlayersPool(data as Player[]));
  }, []);

  const handleStart = () => {
    setPhase('draft');
    setSquad(generatePitch(settings));
    setPickedNames(new Set());
    setPlayerForms({});
    setRerolls(settings.difficulty === 'easy' ? 3 : settings.difficulty === 'normal' ? 1 : 0);
  };

  const handleFinishDraft = (currentSquad: SquadSlot[]) => {
    const filledSlots = currentSquad.filter(s => s.player !== null);
    const forms = initPlayerForms(filledSlots);
    setPlayerForms(forms);
    setTimeout(() => setPhase('squad-complete'), 800);
  };

  const handlePickPlayer = (p: Player, slotIdx: number) => {
    const newSquad = [...squad];
    newSquad[slotIdx].player = p;
    setSquad(newSquad);
    setPickedNames(new Set(pickedNames).add(p.name.toLowerCase().trim()));

    const isFull = newSquad.filter(s => s.player).length === (settings.mode === 'franchise' ? 25 : 11);
    if (isFull) {
      handleFinishDraft(newSquad);
    }
  };

  const handleSwapPlayers = (idx1: number, idx2: number) => {
    const newSquad = [...squad];
    const temp = newSquad[idx1].player;
    newSquad[idx1].player = newSquad[idx2].player;
    newSquad[idx2].player = temp;
    setSquad(newSquad);
  };

  const handleReroll = () => {
    if (rerolls > 0) setRerolls(rerolls - 1);
  };

  const finishSimulation = (teams: SeasonTeam[], matchResults: MatchResult[], squad: SquadSlot[], strength: ReturnType<typeof calcSquadStrength>, finalForms?: Record<number, PlayerForm>, finalSeasonStats?: Record<number, PlayerStats>, precomputedPlayoffs?: { matches: PlayoffMatch[], champion: string }) => {
    const sorted = sortTable(teams);
    const userTeam = sorted.find(t => t.short === 'YOUR XI')!;
    const finalPos = sorted.findIndex(t => t.short === 'YOUR XI') + 1;
    const { pos: projectedPos } = calcOdds(strength.overall);

    const top4 = sorted.slice(0, 4);
    const playoffs = precomputedPlayoffs || simulatePlayoffs(top4, playersPool, squad);

    const pStats = finalSeasonStats || generatePlayerStats(squad, userTeam.won);
    const awards = generateAwards(squad, pStats);
    const story = generateStory(squad, userTeam, finalPos, projectedPos, playoffs.champion, userTeam.won, userTeam.lost, pStats);

    setResults({
      teams: sorted,
      userTeam,
      finalPos,
      projectedPos,
      awards,
      story,
      champion: playoffs.champion,
      playoffMatches: playoffs.matches,
      playerStats: pStats,
      playerForms: finalForms ?? playerForms,
      matches: matchResults,
    });


  };

  const [watchData, setWatchData] = useState<{
    fixtures: [number, number][];
    teams: SeasonTeam[];
    squad: SquadSlot[];
    strength: ReturnType<typeof calcSquadStrength>;
  } | null>(null);

  const runSimulation = (control?: 'full' | 'ai') => {
    if (control) {
      setSettings(prev => ({ ...prev, franchiseControl: control }));
    }
    
    const strength = calcSquadStrength(squad);
    const teams = generateLeague(strength.overall);

    const userTeam = teams.find(t => t.short === 'YOUR XI');
    const fixtures = generateFixtures(teams);

    if (settings.simSpeed === 'full' || control === 'full' || settings.franchiseControl === 'full' || settings.mode === 'gamble') {
      setWatchData({ fixtures, teams, squad, strength });
      setPhase('watching');
    } else {
      // Fast mode — simulate instantly
      setPhase('simulating');
      let currentForms = { ...playerForms };
      let currentSeasonStats: Record<number, PlayerStats> = {};
      const matchResults = fixtures.map(([a, b]) => {
        const res = simulateMatch(teams[a], teams[b], playersPool, squad, currentForms);
        if (res.matchStats) accumulateStats(currentSeasonStats, res.matchStats);
        applyResult(teams, a, b, res);
        if (res.isUserMatch) {
          currentForms = updateAllForms(currentForms, squad, res.userWon, res.motm?.player.id);
        }
        return res;
      });
      setPlayerForms(currentForms);
      
      if (settings.mode === 'franchise') {
         const sorted = sortTable(teams);
         setPlayoffsData({
            top4: sorted.slice(0, 4),
            teams: sorted,
            leagueMatches: matchResults,
            forms: currentForms,
            stats: currentSeasonStats,
            squad: squad
         });
         setPhase('playoffs-watch');
      } else {
         finishSimulation(teams, matchResults, squad, strength, currentForms, currentSeasonStats);
         setTimeout(() => setPhase('results'), 1500);
      }
    }
  };

  const renderScreen = () => {
    if (phase === 'home') return <HomeScreen onPlay={() => setPhase('mode-select')} onLeaderboard={() => setPhase('leaderboard')} hasActiveGame={squad.length > 0 && !results} onContinue={() => setPhase(lastActivePhase || 'mode-select')} />;
    if (phase === 'leaderboard') return <LeaderboardScreen onBack={() => setPhase('home')} />;
    if (phase === 'mode-select') return <ModeSelectScreen onSelectMode={(m) => {
      setSettings(prev => ({ ...prev, mode: m }));
      if (m === 'gamble') {
        setPhase('gamble-drafting');
      } else {
        setPhase('mode-settings');
      }
    }} />;
    if (phase === 'mode-settings') return <ModeSettingsScreen settings={settings} setSettings={setSettings} onStart={handleStart} mode={settings.mode} />;
    if (phase === 'gamble-drafting') return <GambleDraftScreen playersPool={playersPool} onComplete={(gambleSquad) => {
      setSquad(gambleSquad);
      const filledSlots = gambleSquad.filter(s => s.player !== null);
      const forms = initPlayerForms(filledSlots);
      setPlayerForms(forms);
      setPhase('squad-complete');
    }} />;
    if (phase === 'draft') return <DraftScreen players={playersPool} squad={squad} onPickPlayer={handlePickPlayer} onSwapPlayers={handleSwapPlayers} rerolls={rerolls} onReroll={handleReroll} pickedNames={pickedNames} settings={settings} playerForms={playerForms} onFinishDraft={() => handleFinishDraft(squad)} />;
    if (phase === 'squad-complete') return <SquadCompleteScreen squad={squad} onSimulate={(control) => runSimulation(control)} onRestart={() => setPhase('mode-select')} settings={settings} playerForms={playerForms} />;
    if (phase === 'simulating') return <div className="min-h-screen flex items-center justify-center text-[var(--color-mute)] font-mono text-sm uppercase tracking-widest animate-pulse">Simulating Season...</div>;
    if (phase === 'watching' && watchData) return (
      <WatchModeScreen
        fixtures={watchData.fixtures}
        teams={watchData.teams}
        squad={watchData.squad}
        playersPool={playersPool}
        initialForms={playerForms}
        control={settings.mode === 'franchise' && settings.franchiseControl === 'full' ? 'full' : 'ai'}
        settings={settings}
        onComplete={(teams, matchResults, finalForms, finalSeasonStats, finalSquad) => {
          setPlayerForms(finalForms);
          const finalWatchSquad = finalSquad || watchData.squad;
          const sorted = sortTable(teams);
          const userInPlayoffs = sorted.slice(0, 4).some(t => t.short === 'YOUR XI');
          
          if ((settings.mode === 'franchise' || settings.mode === 'gamble') && userInPlayoffs) {
            setPlayoffsData({
              top4: sorted.slice(0, 4),
              teams: sorted,
              leagueMatches: matchResults,
              forms: finalForms,
              stats: finalSeasonStats,
              squad: finalWatchSquad
            });
            setPhase('playoffs-watch');
          } else {
            finishSimulation(teams, matchResults, finalWatchSquad, watchData.strength, finalForms, finalSeasonStats);
            setPhase('results');
          }
        }}
        onSkip={() => {
          const teams = watchData.teams;
          let currentForms = { ...playerForms };
          let currentSeasonStats: Record<number, PlayerStats> = {};
          const matchResults = watchData.fixtures.map(([a, b]) => {
            const res = simulateMatch(teams[a], teams[b], playersPool, watchData.squad, currentForms);
            if (res.matchStats) accumulateStats(currentSeasonStats, res.matchStats);
            applyResult(teams, a, b, res);
            if (res.isUserMatch) {
              currentForms = updateAllForms(currentForms, watchData.squad, res.userWon, res.motm?.player.id);
            }
            return res;
          });
          setPlayerForms(currentForms);
          
          const sorted = sortTable(teams);
          const userInPlayoffs = sorted.slice(0, 4).some(t => t.short === 'YOUR XI');
          
          if ((settings.mode === 'franchise' || settings.mode === 'gamble') && userInPlayoffs) {
            setPlayoffsData({
              top4: sorted.slice(0, 4),
              teams: sorted,
              leagueMatches: matchResults,
              forms: currentForms,
              stats: currentSeasonStats,
              squad: watchData.squad
            });
            setPhase('playoffs-watch');
          } else {
            finishSimulation(teams, matchResults, watchData.squad, watchData.strength, currentForms, currentSeasonStats);
            setPhase('results');
          }
        }}
      />
    );
    if (phase === 'playoffs-watch' && playoffsData) return (
      <PlayoffsWatchScreen
        top4={playoffsData.top4}
        teams={playoffsData.teams}
        squad={playoffsData.squad}
        playersPool={playersPool}
        initialForms={playoffsData.forms}
        seasonStats={playoffsData.stats}
        settings={settings}
        onComplete={(playoffMatches, champion, finalSquad, finalForms, finalStats) => {
          finishSimulation(playoffsData.teams, playoffsData.leagueMatches, finalSquad, calcSquadStrength(finalSquad), finalForms, finalStats, { matches: playoffMatches, champion });
          setPhase('results');
        }}
      />
    );
    if (phase === 'results' && results) return <ResultsScreen squad={squad} results={results} settings={settings} onRestart={() => {
      setSquad([]);
      setResults(null);
      setLastActivePhase(null);
      setPhase('home');
    }} onViewLeaderboard={() => setPhase('leaderboard')} />;
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <div className="text-xl font-bold text-red-500 mb-2">Session Expired</div>
        <div className="text-sm text-[var(--color-mute)] mb-6">Your session has expired or the page was refreshed. Please start a new game.</div>
        <button onClick={() => setPhase('home')} className="btn-primary px-6 py-2">Go to Home</button>
      </div>
    );
  };

  return (
    <>
      <NavBar currentPhase={phase} onNavigate={setPhase} />
      <div className="pt-16">
        {renderScreen()}
      </div>
    </>
  );
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
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
      className="fixed top-4 right-4 z-50 p-2 bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-full shadow-md text-[var(--color-text-primary)] hover:scale-105 transition-transform"
      aria-label="Toggle dark mode"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

export default function MainApp() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[var(--color-mute)] font-mono text-sm uppercase tracking-widest animate-pulse">Loading...</div>}>
      <ThemeToggle />
      <MainAppContent />
    </Suspense>
  );
}

