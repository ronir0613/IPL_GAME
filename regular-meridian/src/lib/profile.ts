import type { Player } from './types';

export type CardTier = 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Standard';

export interface RunRecord {
  id: string;
  date: string;
  wins: number;
  losses: number;
  position: number;
  champion: boolean;
  tier: CardTier;
  playingXI: Player[];
  mode: string;
  difficulty: string;
}

export interface PlayerProfileData {
  playerId: string;
  handle: string | null;
  runs: RunRecord[];
}

const STORAGE_KEY = '160play_profile';

export function getProfileData(): PlayerProfileData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as PlayerProfileData;
    }
  } catch (e) {
    console.error('Failed to parse profile data from localStorage', e);
  }
  
  // Return default empty state
  return {
    playerId: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
    handle: null,
    runs: []
  };
}

export function saveProfileData(data: PlayerProfileData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save profile data to localStorage', e);
  }
}

export function setProfileHandle(handle: string) {
  const data = getProfileData();
  data.handle = handle;
  saveProfileData(data);
}

export function saveRunToProfile(
  wins: number, 
  losses: number, 
  position: number, 
  champion: boolean, 
  playingXI: Player[],
  mode: string,
  difficulty: string,
  tier: CardTier
) {
  const data = getProfileData();
  const newRun: RunRecord = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    wins,
    losses,
    position,
    champion,
    tier,
    playingXI,
    mode,
    difficulty
  };
  
  data.runs.push(newRun);
  saveProfileData(data);
}

export function exportProfileData(): string {
  const data = getProfileData();
  return JSON.stringify(data, null, 2);
}

export function importProfileData(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString) as PlayerProfileData;
    if (parsed && parsed.playerId && Array.isArray(parsed.runs)) {
      saveProfileData(parsed);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to import profile data', e);
    return false;
  }
}
