import statsData from '../data/player-stats.json';
import generatedMap from '../data/cricsheet-map.json';
import overrideData from '../data/cricsheet-overrides.json';
import { getCanonicalSlug } from './canonical';

export interface PlayerCareerStats {
  matches: number;
  firstSeason: number | null;
  lastSeason: number | null;
  batting: {
    innings: number;
    runs: number;
    ballsFaced: number;
    dismissals: number;
    average: number | null;
    strikeRate: number | null;
    fifties: number;
    hundreds: number;
    highestScore: number;
    fours: number;
    sixes: number;
  };
  bowling: {
    matches: number;
    legalBalls: number;
    runsConceded: number;
    wickets: number;
    economy: number | null;
    bestBowling: { wickets: number; runs: number } | null;
    threeWicketHaulsOrBetter: number;
  };
}

interface StatsData {
  data_version: {
    source: string;
    sourceUrl: string;
    downloadDate: string;
    generatedAt: string;
    matchesProcessed: number;
  };
  players: Record<string, PlayerCareerStats>;
}

const stats = statsData as StatsData;
const autoMatches = generatedMap as Record<string, string>;
const manualOverrides = ((overrideData as { manualOverrides?: Record<string, string> }).manualOverrides ?? {});

function getManualOverride(canonicalSlug: string): string | undefined {
  const aliases = Object.entries(manualOverrides)
    .filter(([slug]) => getCanonicalSlug(slug) === canonicalSlug)
    .map(([, identifier]) => identifier);
  return manualOverrides[canonicalSlug] ?? aliases[0];
}

export function getCricsheetPlayerIdBySlug(slug: string): string | null {
  const canonicalSlug = getCanonicalSlug(slug);
  return getManualOverride(canonicalSlug) ?? autoMatches[canonicalSlug] ?? autoMatches[slug] ?? null;
}

export function getPlayerStatsBySlug(slug: string): PlayerCareerStats | null {
  const identifier = getCricsheetPlayerIdBySlug(slug);
  return identifier ? stats.players[identifier] ?? null : null;
}

export function getPlayerStatsDataVersion(): StatsData['data_version'] {
  return stats.data_version;
}

export function formatOvers(legalBalls: number): string {
  return `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
}
