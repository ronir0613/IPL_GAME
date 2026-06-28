// Game Types
export type { FormCategory, FormGrade, FormTrend, PerformanceEntry, PlayerForm } from './form';

export type Role = 'WK' | 'BAT' | 'AR' | 'BOWL' | 'BAT_AR' | 'BOWL_AR';

export type Difficulty = 'easy' | 'normal' | 'hard';
export type ShowRatings = 'on' | 'off';
export type SimSpeed = 'fast' | 'full';
export type GameMode = 'classic' | 'franchise' | 'gamble';

export interface GameSettings {
  difficulty: Difficulty;
  showRatings: ShowRatings;
  simSpeed: SimSpeed;
  mode: GameMode;
  franchiseControl?: 'full' | 'ai';
}

export interface Player {
  id: number;
  name: string;
  team: string;
  season: number;
  role: Role;
  baseRole?: Role;
  allowedRoles?: Role[];
  overall: number;
  is_overseas?: boolean;
}

export interface PlayerStats {
  runs: number;
  strikeRate: number;
  wickets: number;
  economy: number;
  mvpScore?: number;
  name?: string;
  team?: string;
  isUserTeam?: boolean;
}

export interface SquadSlot {
  position: string;
  x: number;
  y: number;
  player: Player | null;
}

export interface TeamStrength {
  batting: number;
  bowling: number;
  overall: number;
  breakdown?: {
    rawAvg: number;
    stackingPenalty: number;
    overseasPenalty: number;
    chemistryBonus: number;
    rivalryPenalty?: number;
    teamIdentityBonus?: number;
    diminishingPenalty: number;
    identities?: string[];
  };
}

export interface SeasonTeam {
  name: string;
  short: string;
  batting: number;
  bowling: number;
  overall: number;
  played: number;
  won: number;
  lost: number;
  points: number;
  nrr: number;
  streak?: number;
  hasDestinyUsed?: boolean;
  riskProfile?: 'Safe' | 'Balanced' | 'High-Risk' | 'Blitz';
  captain?: string;
}

export interface MotmStats {
  player: Player;
  runs: number;
  balls: number;
  wickets: number;
  runsConceded: number;
  isBatter: boolean;
  isBowler: boolean;
  isAllRounder: boolean;
  rating: number; // 1-10 rating for UI display
  summary: string; // e.g., "82 (41)" or "4/18"
}

export interface MatchHighlight {
  id: string;
  category: 'batting' | 'bowling' | 'milestone' | 'clutch' | 'fielding' | 'team';
  text: string;
}

export type RainEventType = 'abandoned' | 'dls_reduced';

export interface RainEvent {
  type: RainEventType;
  description: string;
}

export interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: string;
  awayScore: string;
  winner: string;
  margin: string;
  isUserMatch: boolean;
  userWon: boolean;
  motm?: MotmStats;
  highlights?: MatchHighlight[];
  rainEvent?: RainEvent;
  matchStats?: Record<number, PlayerStats>;
  clutchTriggered?: string;
  destinyTriggered?: boolean;
  momentumStateA?: string;
  momentumStateB?: string;
  homeFortressBonus?: string;
}

export interface StoryItem {
  id: string;
  type: 'expert' | 'fan' | 'player' | 'news';
  author: string;
  text: string;
}

export interface PlayoffMatch {
  name: string;
  team1: string;
  team2: string;
  team1Score?: string;
  team2Score?: string;
  winner: string;
  result: string;
  motm?: MotmStats;
  highlights?: MatchHighlight[];
}

export type GamePhase = 
  | 'home'
  | 'mode-select'
  | 'mode-settings'
  | 'gamble-drafting'
  | 'draft' 
  | 'squad-complete' 
  | 'match-prep'
  | 'simulating'
  | 'watching'
  | 'playoffs-watch'
  | 'full-control-season'
  | 'playoffs_prep'
  | 'results'
  | 'leaderboard';

export interface MatchPrepConfig {
  playingXI: Player[];
  impactBench: Player[];
  isPlayoff?: boolean;
}

export const IPL_TEAMS = [
  { name: 'Mumbai Indians', short: 'MI', color: '#004BA0' },
  { name: 'Chennai Super Kings', short: 'CSK', color: '#F7C600' },
  { name: 'Royal Challengers Bengaluru', short: 'RCB', color: '#CC0000' },
  { name: 'Kolkata Knight Riders', short: 'KKR', color: '#3A225D' },
  { name: 'Delhi Capitals', short: 'DC', color: '#00008B' },
  { name: 'Punjab Kings', short: 'PBKS', color: '#AA2829' },
  { name: 'Rajasthan Royals', short: 'RR', color: '#254AA5' },
  { name: 'Sunrisers Hyderabad', short: 'SRH', color: '#F7A721' },
  { name: 'Gujarat Titans', short: 'GT', color: '#1C3A6A' },
  { name: 'Lucknow Super Giants', short: 'LSG', color: '#A0D4E0' },
  { name: 'Deccan Chargers', short: 'DCH', color: '#F7A721' },
  { name: 'Pune Warriors India', short: 'PWI', color: '#8B0000' },
  { name: 'Kochi Tuskers Kerala', short: 'KTK', color: '#6A0DAD' },
  { name: 'Rising Pune Supergiant', short: 'RPS', color: '#E03A3E' },
  { name: 'Gujarat Lions', short: 'GL', color: '#E8461E' },
];

// Historical franchise strength ratings (batting/bowling/overall)
export const FRANCHISE_STRENGTH: Record<string, { batting: number; bowling: number; overall: number }> = {
  'MI': { batting: 82, bowling: 81, overall: 82 },
  'CSK': { batting: 81, bowling: 80, overall: 81 },
  'RCB': { batting: 83, bowling: 75, overall: 79 },
  'KKR': { batting: 78, bowling: 79, overall: 79 },
  'DC': { batting: 76, bowling: 77, overall: 77 },
  'PBKS': { batting: 77, bowling: 75, overall: 76 },
  'RR': { batting: 76, bowling: 77, overall: 76 },
  'SRH': { batting: 77, bowling: 81, overall: 79 },
  'GT': { batting: 78, bowling: 79, overall: 79 },
  'LSG': { batting: 76, bowling: 76, overall: 76 },
  'DCH': { batting: 75, bowling: 76, overall: 76 },
  'PWI': { batting: 74, bowling: 73, overall: 74 },
  'KTK': { batting: 74, bowling: 74, overall: 74 },
  'RPS': { batting: 78, bowling: 77, overall: 78 },
  'GL': { batting: 77, bowling: 76, overall: 77 },
};

export type GamblePhilosophy = 
  | 'BALANCED'
  | 'POWER HITTERS'
  | 'SPIN DOMINANCE'
  | 'PACE DOMINANCE'
  | 'DEATH OVER MONSTERS'
  | 'CLUTCH PLAYERS'
  | 'PLAYOFF SPECIALISTS'
  | 'OLD SCHOOL LEGENDS'
  | 'AGGRESSIVE BATTING'
  | 'DEFENSIVE BOWLING'
  | 'ALL CAPTAINS'
  | 'MEME TEAM'
  | 'ALL ROUNDERS'
  | 'YOUTH ACADEMY'
  | 'T20 MERCENARIES';

export type GambleSpecialEvent = 
  | 'NONE'
  | 'JACKPOT TEAM'
  | 'CURSED TEAM'
  | 'ALL-TIME XI'
  | 'THE RETIREMENT HOME'
  | 'THE GOD SQUAD'
  | 'THE MEME SQUAD'
  | 'THE UNDERDOGS';
