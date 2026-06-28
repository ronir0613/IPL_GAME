// ─── Player Form System ──────────────────────────────────────────────────────
// Tracks each player's last-5 performances and derives a Form Index (0-100).
// Form evolves every match and slightly influences simulation outcomes.

import type { Player, SquadSlot } from './types';
import { randInt, randFloat } from './engine';

// ─── Types ───────────────────────────────────────────────────────────────────

export type FormCategory =
  | 'Legendary'
  | 'Elite'
  | 'Excellent'
  | 'Great'
  | 'Good'
  | 'Average'
  | 'Poor'
  | 'Out of Form';

export type FormGrade = 'S+' | 'S' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';

export type FormTrend = '▲▲' | '▲' | '▬' | '▼' | '▼▼';

export interface PerformanceEntry {
  // Batting
  runs?: number;
  balls?: number;
  strikeRate?: number;
  // Bowling
  wickets?: number;
  runsConceded?: number;
  overs?: number;
  economy?: number;
  // Meta
  isMatchWinning?: boolean;
  label: string; // Display string, e.g. "82 (41)" or "3/22"
}

export interface PlayerForm {
  score: number;           // 0-100 Form Index
  prevScore: number;       // Score before last update (for trend delta)
  category: FormCategory;
  grade: FormGrade;
  trend: FormTrend;
  trendDelta: number;      // signed int, e.g. +8 or -4
  last5: PerformanceEntry[];
  matchesPlayed: number;
}

// ─── Mapping helpers ─────────────────────────────────────────────────────────

export function getFormCategory(score: number): FormCategory {
  if (score >= 95) return 'Legendary';
  if (score >= 90) return 'Elite';
  if (score >= 85) return 'Excellent';
  if (score >= 75) return 'Great';
  if (score >= 65) return 'Good';
  if (score >= 55) return 'Average';
  if (score >= 40) return 'Poor';
  return 'Out of Form';
}

export function getFormGrade(score: number): FormGrade {
  if (score >= 95) return 'S+';
  if (score >= 90) return 'S';
  if (score >= 85) return 'A+';
  if (score >= 75) return 'A';
  if (score >= 65) return 'B+';
  if (score >= 55) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

export function getFormTrend(delta: number): FormTrend {
  if (delta >= 10) return '▲▲';
  if (delta >= 4)  return '▲';
  if (delta <= -10) return '▼▼';
  if (delta <= -4)  return '▼';
  return '▬';
}

export function getTrendColor(trend: FormTrend): string {
  if (trend === '▲▲') return '#22c55e';
  if (trend === '▲')  return '#4ade80';
  if (trend === '▬')  return '#9ca3af';
  if (trend === '▼')  return '#f87171';
  return '#ef4444';
}

export function getCategoryColor(cat: FormCategory): string {
  switch (cat) {
    case 'Legendary':   return '#fbbf24'; // gold
    case 'Elite':       return '#a78bfa'; // violet
    case 'Excellent':   return '#60a5fa'; // blue
    case 'Great':       return '#34d399'; // green
    case 'Good':        return '#6ee7b7'; // light green
    case 'Average':     return '#9ca3af'; // gray
    case 'Poor':        return '#fb923c'; // orange
    case 'Out of Form': return '#ef4444'; // red
  }
}

export function getFormBarColor(score: number): string {
  if (score >= 90) return '#a78bfa';
  if (score >= 85) return '#60a5fa';
  if (score >= 75) return '#34d399';
  if (score >= 65) return '#6ee7b7';
  if (score >= 55) return '#9ca3af';
  if (score >= 40) return '#fb923c';
  return '#ef4444';
}

// ─── Form bonus to win probability ────────────────────────────────────────

export function getFormWinBonus(category: FormCategory): number {
  switch (category) {
    case 'Legendary':   return 0.06;
    case 'Elite':       return 0.04;
    case 'Excellent':   return 0.03;
    case 'Great':       return 0.02;
    case 'Good':        return 0.01;
    case 'Average':     return 0.00;
    case 'Poor':        return -0.02;
    case 'Out of Form': return -0.05;
  }
}

/**
 * Returns the average form bonus across all players in the user's squad.
 * Capped to prevent form from completely overriding ratings.
 */
export function calcSquadFormBonus(playerForms: Record<number, PlayerForm>): number {
  const forms = Object.values(playerForms);
  if (forms.length === 0) return 0;
  const total = forms.reduce((sum, f) => sum + getFormWinBonus(f.category), 0);
  const avg = total / forms.length;
  // Cap at ±0.06 overall so ratings still dominate
  return Math.max(-0.06, Math.min(0.06, avg));
}

// ─── Performance generation ───────────────────────────────────────────────

/**
 * Generate a realistic match performance for a player based on their role,
 * overall rating, current form, and whether their team won.
 */
export function generatePerformance(
  player: Player,
  currentForm: PlayerForm,
  teamWon: boolean,
  isMotm: boolean
): PerformanceEntry {
  const overallFactor = player.overall / 85; // normalise around 85
  const formFactor = 0.7 + (currentForm.score / 100) * 0.6; // 0.7 – 1.3 range
  const wonBonus = teamWon ? 1.1 : 0.9;

  const isBatter = player.role === 'BAT' || player.role === 'WK' || player.role === 'BAT_AR';
  const isBowler = player.role === 'BOWL' || player.role === 'BOWL_AR';
  const isAR = player.role === 'AR' || player.role === 'BAT_AR' || player.role === 'BOWL_AR';

  // ── Batter ──
  if (isBatter && !isBowler) {
    const baseRuns = isMotm ? randInt(50, 110) : randInt(0, 65);
    const runs = Math.round(baseRuns * overallFactor * formFactor * wonBonus);
    const clampedRuns = Math.max(0, Math.min(120, runs));
    const sr = Math.round(randFloat(100, 180) * (clampedRuns > 10 ? formFactor : 0.8));
    const balls = clampedRuns > 0 ? Math.round((clampedRuns / sr) * 100) : 0;
    return {
      runs: clampedRuns,
      balls,
      strikeRate: sr,
      isMatchWinning: isMotm && clampedRuns >= 50,
      label: balls > 0 ? `${clampedRuns} (${balls})` : `${clampedRuns}`,
    };
  }

  // ── Bowler ──
  if (isBowler && !isAR) {
    const baseWickets = isMotm ? randInt(2, 5) : randInt(0, 3);
    const wickets = Math.min(5, Math.round(baseWickets * overallFactor * formFactor));
    const overs = 4;
    const baseEcon = 8 - (player.overall * 0.03);
    const economy = Math.max(4, Math.round((baseEcon / formFactor) * 10) / 10);
    const rc = Math.round(economy * overs);
    return {
      wickets,
      runsConceded: rc,
      overs,
      economy,
      isMatchWinning: isMotm && wickets >= 3,
      label: `${wickets}/${rc}`,
    };
  }

  // ── All-Rounder ──
  if (isAR) {
    const isBatFocus = player.role === 'BAT_AR';
    const isBowlFocus = player.role === 'BOWL_AR';

    // Batting contribution
    const baseRuns = isMotm
      ? randInt(isBatFocus ? 40 : 20, isBatFocus ? 80 : 45)
      : randInt(0, isBatFocus ? 50 : 30);
    const runs = Math.max(0, Math.round(baseRuns * overallFactor * formFactor * wonBonus));
    const balls = runs > 0 ? Math.round(runs / (randFloat(1.2, 1.9))) : 0;

    // Bowling contribution
    const baseWickets = isMotm
      ? randInt(isBowlFocus ? 2 : 1, isBowlFocus ? 4 : 2)
      : randInt(0, isBowlFocus ? 3 : 2);
    const wickets = Math.min(4, Math.round(baseWickets * overallFactor * formFactor));
    const economy = Math.max(5, Math.round((9 / formFactor) * 10) / 10);
    const rc = Math.round(economy * 4);

    const label = wickets > 0
      ? `${runs} (${balls}) & ${wickets}/${rc}`
      : `${runs} (${balls})`;

    return { runs, balls, wickets, runsConceded: rc, economy, isMatchWinning: isMotm, label };
  }

  // Fallback
  return { runs: 0, label: '0' };
}

// ─── Score a single performance entry (returns 0-100) ─────────────────────

function scorePerformance(perf: PerformanceEntry, player: Player): number {
  const isBatter = player.role === 'BAT' || player.role === 'WK' || player.role === 'BAT_AR';
  const isBowler = player.role === 'BOWL' || player.role === 'BOWL_AR';

  let score = 50; // baseline Average

  if (isBatter && !isBowler) {
    const runs = perf.runs ?? 0;
    const sr = perf.strikeRate ?? 120;
    // Runs score: scale 100 runs = ~85 points
    const runsScore = Math.min(100, runs * 0.85);
    // SR bonus: >150 = bonus, <100 = penalty
    const srBonus = (sr - 120) * 0.15;
    score = Math.min(100, runsScore + srBonus);
    if (perf.isMatchWinning) score = Math.min(100, score + 8);
  } else if (isBowler && player.role !== 'AR') {
    const wkts = perf.wickets ?? 0;
    const econ = perf.economy ?? 8;
    // Wickets: 3 wickets ≈ 75, 5 wickets ≈ 100
    const wktScore = Math.min(100, wkts * 25);
    // Economy bonus: <7 is good
    const econBonus = (7.5 - econ) * 4;
    score = Math.min(100, Math.max(0, wktScore + econBonus + 15));
    if (perf.isMatchWinning) score = Math.min(100, score + 8);
  } else {
    // All-rounder: blend both
    const runs = perf.runs ?? 0;
    const wkts = perf.wickets ?? 0;
    const econ = perf.economy ?? 8;
    const batScore = Math.min(100, runs * 0.75);
    const bowlScore = Math.min(100, wkts * 22 + (7.5 - econ) * 3);
    score = (batScore + bowlScore) / 2 + 10;
    score = Math.min(100, Math.max(0, score));
    if (perf.isMatchWinning) score = Math.min(100, score + 6);
  }

  return Math.max(0, Math.min(100, score));
}

// ─── Calculate form score from last-5 performances ───────────────────────

const WEIGHTS = [0.35, 0.25, 0.20, 0.12, 0.08]; // most recent first

export function calcFormScore(last5: PerformanceEntry[], player: Player): number {
  if (last5.length === 0) return 55; // default Average before any matches

  const scores = last5.map(p => scorePerformance(p, player));
  let weighted = 0;
  let totalWeight = 0;

  scores.forEach((s, i) => {
    const w = WEIGHTS[i] ?? 0.05;
    weighted += s * w;
    totalWeight += w;
  });

  const base = totalWeight > 0 ? weighted / totalWeight : 55;

  // Add a small random seasonal drift (±4 max) so form feels organic
  const drift = randFloat(-3, 3);
  return Math.max(0, Math.min(100, Math.round(base + drift)));
}

// ─── Initialise forms ─────────────────────────────────────────────────────

export function initPlayerForms(squad: SquadSlot[]): Record<number, PlayerForm> {
  const forms: Record<number, PlayerForm> = {};

  for (const slot of squad) {
    if (!slot.player) continue;
    const p = slot.player;

    // Start all players with a score derived from their overall rating
    // (great players start with a higher baseline)
    const baseline = Math.round(45 + (p.overall - 70) * 0.5);
    const startScore = Math.max(40, Math.min(75, baseline));

    forms[p.id] = {
      score: startScore,
      prevScore: startScore,
      category: getFormCategory(startScore),
      grade: getFormGrade(startScore),
      trend: '▬',
      trendDelta: 0,
      last5: [],
      matchesPlayed: 0,
    };
  }

  return forms;
}

// ─── Update form after a match ────────────────────────────────────────────

export function updatePlayerForm(
  form: PlayerForm,
  perf: PerformanceEntry,
  player: Player
): PlayerForm {
  // Prepend newest, keep only last 5
  const newLast5 = [perf, ...form.last5].slice(0, 5);

  const prevScore = form.score;
  const newScore = calcFormScore(newLast5, player);
  const delta = newScore - prevScore;

  return {
    score: newScore,
    prevScore,
    category: getFormCategory(newScore),
    grade: getFormGrade(newScore),
    trend: getFormTrend(delta),
    trendDelta: delta,
    last5: newLast5,
    matchesPlayed: form.matchesPlayed + 1,
  };
}

/**
 * Update all squad players' forms after a match involving the user's team.
 * Only updates players (we don't track AI team individual forms).
 */
export function updateAllForms(
  playerForms: Record<number, PlayerForm>,
  squad: SquadSlot[],
  userWon: boolean,
  motmPlayerId?: number
): Record<number, PlayerForm> {
  const updated = { ...playerForms };

  for (const slot of squad) {
    if (!slot.player) continue;
    const p = slot.player;
    const form = updated[p.id];
    if (!form) continue;

    const isMotm = p.id === motmPlayerId;
    const perf = generatePerformance(p, form, userWon, isMotm);
    updated[p.id] = updatePlayerForm(form, perf, p);
  }

  return updated;
}
