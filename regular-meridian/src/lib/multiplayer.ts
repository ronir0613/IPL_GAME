import type { Player, MpPlayer, MpSettings, MpState, MatchResult, MatchPrepConfig } from './types';

// Message schema for multiplayer actions
export type MpMessageType =
  | 'CLIENT_JOIN'
  | 'LOBBY_UPDATE'
  | 'START_DRAFT'
  | 'PICK_PLAYER'
  | 'DRAFT_UPDATE'
  | 'SUBMIT_TACTICS'
  | 'TACTICS_UPDATE'
  | 'SIMULATE_ROUND'
  | 'MATCH_RESULTS'
  | 'LEAVE_ROOM'
  | 'SELECT_FRANCHISE'
  | 'PLACE_BID'
  | 'FORCE_START_SEASON'
  | 'SKIP_PLAYER'
  | 'SEND_CHAT';

export interface MpMessage {
  type: MpMessageType;
  senderPeerId: string;
  senderName: string;
  payload: any;
}

// Generate a random room code (5 uppercase alphanumeric characters)
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omitted confusing chars like I, O, 0, 1
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// MultiplayerManager has been migrated to PusherManager in src/lib/pusher.ts


// AI Player Pick Selector (For automatic picks when timer runs out or filling remaining slots)
export function getBestAiPick(
  playersPool: Player[],
  pickedIds: number[],
  currentRoster: Player[],
  settings: MpSettings
): Player {
  // Filter out already picked players
  const available = playersPool.filter(p => !pickedIds.includes(p.id));
  
  // Count overseas in current roster
  const overseasCount = currentRoster.filter(p => p.is_overseas).length;
  const allowOverseas = overseasCount < settings.maxOverseas;
  
  // Roster check
  const countRole = (role: string) => currentRoster.filter(p => p.role.includes(role) || (role === 'WK' && p.role === 'WK')).length;
  const hasWK = countRole('WK') >= 1;
  const batCount = countRole('BAT');
  const bowlCount = countRole('BOWL');
  
  // Remaining picks in the draft
  const remainingSlots = settings.rounds - currentRoster.length;
  
  // Filter out overseas if we hit limit
  let pool = available;
  if (!allowOverseas) {
    pool = pool.filter(p => !p.is_overseas);
  }
  
  // Prioritize critical roles if we are running low on slots
  if (remainingSlots <= 4) {
    if (!hasWK) {
      const wkPool = pool.filter(p => p.role === 'WK');
      if (wkPool.length > 0) pool = wkPool;
    } else if (batCount < 3) {
      const batPool = pool.filter(p => p.role.includes('BAT'));
      if (batPool.length > 0) pool = batPool;
    } else if (bowlCount < 3) {
      const bowlPool = pool.filter(p => p.role.includes('BOWL'));
      if (bowlPool.length > 0) pool = bowlPool;
    }
  }

  // Sort by overall descending
  pool.sort((a, b) => b.overall - a.overall);

  // Return the best available, or if empty fallback to any available
  if (pool.length > 0) {
    return pool[0];
  }
  
  // Final fallback
  const fallbackPool = available.slice().sort((a, b) => b.overall - a.overall);
  return fallbackPool[0];
}

// Get dynamic player base price based on rating and category
export function getPlayerBasePrice(overall: number, category: string, isOverseas: boolean, isMarquee: boolean): { numeric: number; formatted: string } {
  if (isMarquee) return { numeric: 200, formatted: '2.00 Cr' };
  if (isOverseas) {
    if (overall >= 85) return { numeric: 200, formatted: '2.00 Cr' };
    if (overall >= 82) return { numeric: 100, formatted: '1.00 Cr' };
    return { numeric: 50, formatted: '50 L' };
  }
  if (category === 'Capped') {
    if (overall >= 85) return { numeric: 150, formatted: '1.50 Cr' };
    if (overall >= 82) return { numeric: 100, formatted: '1.00 Cr' };
    return { numeric: 50, formatted: '50 L' };
  }
  // Uncapped
  if (overall >= 82) return { numeric: 50, formatted: '50 L' };
  return { numeric: 20, formatted: '20 L' };
}

// Get standard IPL auction bid increment based on current price
export function getBidIncrement(currentBidLakhs: number): number {
  if (currentBidLakhs < 100) return 5;     // +5L below 1Cr
  if (currentBidLakhs < 200) return 10;    // +10L between 1Cr and 2Cr
  if (currentBidLakhs < 500) return 20;    // +20L between 2Cr and 5Cr
  return 50;                               // +50L above 5Cr
}

// Calculate AI team's maximum valuation for a player during auction
export function getAiValuation(
  player: Player,
  remainingPurse: number,
  currentRoster: Player[],
  maxRoster: number
): number {
  // Base valuation correlates with overall rating
  // E.g., rating 80 -> ~50L base, rating 90 -> ~400L base, rating 95 -> ~800L base
  const overall = player.overall;
  let baseVal = 20; // fallback minimum
  
  if (overall >= 93) baseVal = 700 + (overall - 93) * 100;
  else if (overall >= 88) baseVal = 300 + (overall - 88) * 80;
  else if (overall >= 84) baseVal = 150 + (overall - 84) * 40;
  else if (overall >= 80) baseVal = 50 + (overall - 80) * 25;
  else baseVal = 20 + (overall - 75) * 6;

  // Add random variance (+/- 15%) to simulate different franchise behaviors
  const variance = 0.85 + Math.random() * 0.30;
  let valuation = Math.round(baseVal * variance);

  // Bonus for marquee or high overseas appeal
  if (player.overall >= 90) valuation += 100;
  
  // Roster check adjustment:
  const countRole = (role: string) => currentRoster.filter(p => p.role.includes(role) || (role === 'WK' && p.role === 'WK')).length;
  const isWKNeeded = countRole('WK') === 0;
  const batCount = countRole('BAT');
  const bowlCount = countRole('BOWL');
  const overseasCount = currentRoster.filter(p => p.is_overseas).length;

  // If this is a WK and AI doesn't have one yet, bump valuation!
  if (player.role === 'WK' && isWKNeeded) {
    valuation += 150;
  }
  // If role is already saturated, slash valuation!
  if (player.role.includes('BAT') && batCount >= 5) valuation = Math.round(valuation * 0.4);
  if (player.role.includes('BOWL') && bowlCount >= 5) valuation = Math.round(valuation * 0.4);

  // Overseas constraints
  if (player.is_overseas) {
    if (overseasCount >= 4) {
      return 0; // cannot bid on overseas
    } else if (overseasCount === 3) {
      valuation = Math.round(valuation * 0.7); // discount if approaching limit
    }
  }

  // Reserve Purse Rule check:
  const remainingSlots = maxRoster - currentRoster.length;
  const minRequiredReserve = (remainingSlots - 1) * 20; // keep at least 20L per remaining slot
  
  const maxPossibleBid = remainingPurse - minRequiredReserve;
  
  if (valuation > maxPossibleBid) {
    valuation = maxPossibleBid;
  }

  return Math.max(0, valuation);
}
