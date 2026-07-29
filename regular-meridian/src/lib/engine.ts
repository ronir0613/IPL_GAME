// Game simulation engine

import { IPL_TEAMS, FRANCHISE_STRENGTH } from './types';
import type { Player, SquadSlot, TeamStrength, SeasonTeam, MatchResult, PlayoffMatch, PlayerStats, MotmStats, StoryItem } from './types';
import { calcSquadFormBonus } from './form';
import type { PlayerForm } from './form';

// --- Seeded random ---
let seed = Date.now();
function rng() {
  seed = (seed * 1664525 + 1013904223) & 0xffffffff;
  return (seed >>> 0) / 0xffffffff;
}
export function setSeed(s: number) { seed = s; }
export function randInt(min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
export function randFloat(min: number, max: number) {
  return rng() * (max - min) + min;
}
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

// --- Squad strength ---
export function calcSquadStrength(slots: SquadSlot[]): TeamStrength {
  // Only use the first 11 players for strength calculations
  const filled = slots.slice(0, 11).filter(s => s.player !== null).map(s => s.player!);
  if (filled.length === 0) return { batting: 0, bowling: 0, overall: 0 };

  let totalBatting = 0;
  let totalBowling = 0;
  let battingWeightSum = 0;
  let bowlingWeightSum = 0;

  for (const p of filled) {
    let batW = 0, bowlW = 0;
    switch (p.role) {
      case 'BAT': batW = 1.0; bowlW = 0.0; break;
      case 'WK': batW = 1.0; bowlW = 0.0; break;
      case 'BAT_AR': batW = 1.0; bowlW = 0.25; break;
      case 'AR': batW = 0.75; bowlW = 0.75; break;
      case 'BOWL_AR': batW = 0.25; bowlW = 1.0; break;
      case 'BOWL': batW = 0.0; bowlW = 1.0; break;
    }
    totalBatting += p.overall * batW;
    totalBowling += p.overall * bowlW;
    battingWeightSum += batW;
    bowlingWeightSum += bowlW;
  }

  const battingRaw = battingWeightSum > 0 ? totalBatting / battingWeightSum : 0;
  const bowlingRaw = bowlingWeightSum > 0 ? totalBowling / bowlingWeightSum : 0;
  const rawAvg = filled.reduce((s, p) => s + p.overall, 0) / filled.length;

  let sumEffective = 0;
  let count92plus = 0;
  let count95plus = 0;
  let overseasCount = 0;
  let totalStackingPenalty = 0;

  // Process individual player penalties (Star Stacking Penalty)
  // Sort players by rating descending so the highest rated ones get counted first
  const sortedPlayers = [...filled].sort((a, b) => b.overall - a.overall);
  for (const p of sortedPlayers) {
    let penalty = 0;
    if (p.overall >= 92) {
      count92plus++;
      if (count92plus > 2) penalty += 2;
    }
    if (p.overall >= 95) {
      count95plus++;
      if (count95plus > 1) penalty += 3;
    }
    totalStackingPenalty += penalty;
    sumEffective += (p.overall - penalty);
    if (p.is_overseas) overseasCount++;
  }

  const averageEffective = sumEffective / filled.length;

  // Overseas Quality Penalty
  let overseasPenalty = 0;
  if (overseasCount === 2) overseasPenalty = 1;
  else if (overseasCount === 3) overseasPenalty = 2;
  else if (overseasCount >= 4) overseasPenalty = 3;

  // Team Chemistry Bonus & Signature Pairs
  let chemistryBonus = 0;
  const names = new Set(filled.map(p => p.name.toLowerCase()));
  const pairs = [
    ['virat kohli', 'ab de villiers'],
    ['ms dhoni', 'suresh raina'],
    ['sunil narine', 'andre russell'],
    ['rohit sharma', 'jasprit bumrah'],
    ['shane watson', 'ms dhoni'],
    ['gautam gambhir', 'robin uthappa'],
    ['kl rahul', 'quinton de kock'],
    ['hardik pandya', 'kieron pollard'],
    ['shikhar dhawan', 'david warner'],
    ['faf du plessis', 'ruturaj gaikwad'],
    ['shreyas iyer', 'rishabh pant'], // new pair
    ['yuzvendra chahal', 'kuldeep yadav'] // new pair
  ];
  for (const [p1, p2] of pairs) {
    if (names.has(p1) && names.has(p2)) {
      chemistryBonus += 1;
    }
  }
  chemistryBonus = Math.min(chemistryBonus, 5);

  // Rivalry Penalty
  let rivalryPenalty = 0;
  const rivalPairs = [
    ['virat kohli', 'gautam gambhir'],
    ['rohit sharma', 'david warner'],
    ['ab de villiers', 'quinton de kock'],
    ['hardik pandya', 'pat cummins']
  ];
  for (const [p1, p2] of rivalPairs) {
    if (names.has(p1) && names.has(p2)) {
      rivalryPenalty += 1;
    }
  }
  rivalryPenalty = Math.min(rivalryPenalty, 3);

  // Team Identity Bonus
  let teamIdentityBonus = 0;
  const identities: string[] = [];
  
  let battersCount = 0;
  let bowlersCount = 0;
  let arCount = 0;
  const franchiseCounts: Record<string, number> = {};

  for (const p of filled) {
    if (p.role === 'BAT' || p.role === 'WK') battersCount++;
    if (p.role === 'BOWL') bowlersCount++;
    if (p.role === 'AR' || p.role === 'BAT_AR' || p.role === 'BOWL_AR') arCount++;
    
    if (p.team) {
      franchiseCounts[p.team] = (franchiseCounts[p.team] || 0) + 1;
    }
  }

  if (battersCount >= 7) {
    teamIdentityBonus += 1;
    identities.push('Batting-Heavy');
  }
  if (bowlersCount >= 5) {
    teamIdentityBonus += 1;
    identities.push('Bowling-Heavy');
  }
  if (arCount >= 4) {
    teamIdentityBonus += 1;
    identities.push('All-Rounder Army');
  }

  // Franchise Core Bonus
  for (const [team, count] of Object.entries(franchiseCounts)) {
    if (count >= 5) {
      teamIdentityBonus += 2;
      identities.push(`${team} Core`);
    } else if (count >= 3) {
      teamIdentityBonus += 1;
      identities.push(`${team} Core`);
    }
  }
  teamIdentityBonus = Math.min(teamIdentityBonus, 5);

  let overall = averageEffective + chemistryBonus + teamIdentityBonus - overseasPenalty - rivalryPenalty;

  // Diminishing returns
  let diminishingPenalty = 0;
  if (overall > 90) {
    diminishingPenalty = (overall - 90) * 0.5; // Diminish the excess by 50% instead of reversing it
    overall -= diminishingPenalty;
  }

  // Adjust batting and bowling proportionally
  const adjust = overall - rawAvg;
  const batting = Math.round(battingRaw + adjust);
  const bowling = Math.round(bowlingRaw + adjust);

  return {
    batting,
    bowling,
    overall: Math.round(overall),
    breakdown: {
      rawAvg: Math.round(rawAvg * 10) / 10,
      stackingPenalty: Math.round(totalStackingPenalty / filled.length * 10) / 10, // show as average impact
      overseasPenalty,
      chemistryBonus,
      rivalryPenalty,
      teamIdentityBonus,
      diminishingPenalty: Math.round(diminishingPenalty * 10) / 10,
      identities
    }
  };
}

// --- Pre-season odds ---
export function calcOdds(overall: number) {
  // Maps overall rating to projected finish (1-10) and win chances
  const pos = overall >= 86 ? 1 :
    overall >= 84 ? 2 :
    overall >= 82 ? 3 :
    overall >= 80 ? 4 :
    overall >= 78 ? 5 :
    overall >= 76 ? 6 :
    overall >= 74 ? 7 :
    overall >= 72 ? 8 :
    overall >= 70 ? 9 : 10;

  const winIPL = overall >= 86 ? 28 : overall >= 84 ? 14 : overall >= 81 ? 7 : overall >= 78 ? 3 : overall >= 75 ? 1 : 0.3;
  const top4 = overall >= 84 ? 75 : overall >= 81 ? 55 : overall >= 78 ? 35 : overall >= 75 ? 18 : 8;
  const bottom2 = overall >= 81 ? 2 : overall >= 78 ? 5 : overall >= 75 ? 12 : 22;
  const expectedPoints = Math.round(28 - (pos - 1) * 2.5);

  return { pos, winIPL, top4, bottom2, expectedPoints };
}

// --- Rating badge color ---
export function ratingColor(r: number): string {
  if (r >= 88) return '#7c3aed';
  if (r >= 86) return '#6d28d9';
  if (r >= 84) return '#1d4ed8';
  if (r >= 81) return '#0369a1';
  if (r >= 78) return '#047857';
  if (r >= 75) return '#b45309';
  if (r >= 70) return '#92400e';
  return '#374151';
}

// --- Generate AI teams for the season ---
export function generateLeague(userOverall: number): SeasonTeam[] {
  // Always include CSK, MI, RCB
  const GUARANTEED = ['CSK', 'MI', 'RCB'];
  const rest = IPL_TEAMS.filter(t => !GUARANTEED.includes(t.short));

  // Shuffle the remaining 12 and pick 7
  const shuffledRest = [...rest].sort(() => rng() - 0.5);
  const chosen7 = shuffledRest.slice(0, 7);

  // Full pool of 10: 3 guaranteed + 7 random
  const pool10 = [
    ...IPL_TEAMS.filter(t => GUARANTEED.includes(t.short)),
    ...chosen7,
  ];

  const teams: SeasonTeam[] = pool10.map(t => {
    const base = FRANCHISE_STRENGTH[t.short] || { batting: 79, bowling: 79, overall: 79 };
    const variance = randInt(-3, 3);
    return {
      name: t.name,
      short: t.short,
      batting: Math.min(99, base.batting + variance),
      bowling: Math.min(99, base.bowling + variance),
      overall: Math.min(99, base.overall + variance),
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
      nrr: 0,
      streak: 0,
      hasDestinyUsed: false,
      riskProfile: rng() > 0.8 ? 'Balanced' : 'Safe',
    };
  });

  const userXI: SeasonTeam = {
    name: 'Your XI',
    short: 'YOUR XI',
    batting: userOverall + randInt(-2, 3),
    bowling: userOverall + randInt(-3, 2),
    overall: userOverall,
    played: 0,
    won: 0,
    lost: 0,
    points: 0,
    nrr: 0,
    streak: 0,
    hasDestinyUsed: false,
    riskProfile: 'Balanced', // Will be overridden by user choice
  };

  // Replace one of the randomly chosen teams with YOUR XI (preserve guaranteed teams)
  const replaceIdx = randInt(3, teams.length - 1);
  teams[replaceIdx] = userXI;
  return teams; // exactly 10 teams
}

function generateMotm(winner: SeasonTeam, playersPool: Player[], userSquad: SquadSlot[], winnerRoster?: Player[]): MotmStats | undefined {
  let candidates: Player[] = [];
  if (winnerRoster && winnerRoster.length > 0) {
    candidates = winnerRoster;
  } else if (winner.short === 'YOUR XI') {
    candidates = userSquad.filter(s => s.player).map(s => s.player!);
  } else {
    candidates = playersPool.filter(p => p.team === winner.short);
  }

  if (candidates.length === 0) return undefined;

  // Pick one randomly, skewed to top players
  const sorted = [...candidates].sort((a, b) => b.overall - a.overall).slice(0, 15);
  const idx = Math.floor(rng() * rng() * sorted.length);
  const p = sorted[idx];

  const isBatter = p.role === 'BAT' || p.role === 'WK' || p.role === 'BAT_AR';
  const isBowler = p.role === 'BOWL' || p.role === 'BOWL_AR';
  const isAllRounder = p.role === 'AR' || p.role === 'BAT_AR' || p.role === 'BOWL_AR';

  let runs = 0;
  let balls = 0;
  let wickets = 0;
  let runsConceded = 0;
  let summary = '';
  const rating = Math.floor(randFloat(8.0, 10.0) * 10) / 10;

  if (isBatter && (!isBowler || rng() > 0.3)) {
    runs = randInt(50, 105);
    balls = Math.floor(runs / randFloat(1.3, 2.2));
    summary = `${runs} (${balls})`;
    if (isAllRounder && rng() > 0.5) {
      wickets = randInt(1, 2);
      runsConceded = randInt(15, 30);
      summary += ` & ${wickets}/${runsConceded}`;
    }
  } else {
    wickets = randInt(3, 5);
    runsConceded = randInt(12, 30);
    summary = `${wickets}/${runsConceded}`;
    if (isAllRounder && rng() > 0.5) {
      runs = randInt(20, 45);
      balls = Math.floor(runs / randFloat(1.3, 2.0));
      summary = `${runs} (${balls}) & ${summary}`;
    }
  }

  return { player: p, runs, balls, wickets, runsConceded, isBatter, isBowler, isAllRounder, rating, summary };
}

import type { MatchHighlight } from './types';

function generateHighlights(
  winner: SeasonTeam,
  loser: SeasonTeam,
  marginStr: string,
  motm: MotmStats | undefined,
  playersPool: Player[],
  userSquad: SquadSlot[],
  winnerRoster?: Player[],
  loserRoster?: Player[]
): MatchHighlight[] {
  const highlights: MatchHighlight[] = [];

  const getPlayers = (team: SeasonTeam) => {
    if (team === winner && winnerRoster && winnerRoster.length > 0) return winnerRoster;
    if (team === loser && loserRoster && loserRoster.length > 0) return loserRoster;
    if (team.short === 'YOUR XI') return userSquad.filter(s => s.player).map(s => s.player!);
    return playersPool.filter(p => p.team === team.short).sort((a, b) => b.overall - a.overall).slice(0, 15);
  };

  const winnerPlayers = getPlayers(winner);
  const loserPlayers = getPlayers(loser);

  if (winnerPlayers.length === 0 || loserPlayers.length === 0) return [];

  const randomPlayer = (players: Player[]) => players[Math.floor(rng() * players.length)];
  const randomBatter = (players: Player[]) => {
    const batters = players.filter(p => p.role === 'BAT' || p.role === 'WK' || p.role === 'BAT_AR');
    return batters.length ? randomPlayer(batters) : randomPlayer(players);
  };
  const randomBowler = (players: Player[]) => {
    const bowlers = players.filter(p => p.role === 'BOWL' || p.role === 'BOWL_AR' || p.role === 'AR');
    return bowlers.length ? randomPlayer(bowlers) : randomPlayer(players);
  };

  let idCounter = 1;
  const addHighlight = (cat: MatchHighlight['category'], text: string) => {
    highlights.push({ id: `hl_${Date.now()}_${idCounter++}_${Math.floor(rng() * 1000)}`, category: cat, text });
  };

  // 1. MotM Highlight (Guaranteed if motm exists)
  if (motm) {
    if (motm.isBatter && motm.runs >= 50) {
      addHighlight('batting', `${motm.player.name.split(' ').pop()} smashed a match-winning ${motm.runs} off just ${motm.balls} balls.`);
    } else if (motm.isBowler && motm.wickets >= 3) {
      addHighlight('bowling', `${motm.player.name.split(' ').pop()} dismantled the batting lineup with ${motm.wickets}/${motm.runsConceded}.`);
    } else {
      addHighlight('clutch', `${motm.player.name.split(' ').pop()} delivered a clutch performance to secure the win.`);
    }
  }

  // 2. Random Match Event Highlight
  const r = rng();
  if (r > 0.8) {
    const bowler = randomBowler(winnerPlayers);
    addHighlight('clutch', `${bowler.name.split(' ').pop()} held his nerve to defend crucial runs in the death overs.`);
  } else if (r > 0.6) {
    const batter = randomBatter(loserPlayers);
    addHighlight('batting', `A valiant fighting knock of ${randInt(40, 75)} by ${batter.name.split(' ').pop()} went in vain.`);
  } else if (r > 0.4) {
    const p1 = randomBatter(winnerPlayers);
    const p2 = randomBatter(winnerPlayers);
    if (p1.id !== p2.id) {
      addHighlight('team', `A massive ${randInt(60, 110)}-run partnership between ${p1.name.split(' ').pop()} and ${p2.name.split(' ').pop()} shifted the momentum.`);
    }
  } else if (r > 0.2) {
    const fielder = randomPlayer(winnerPlayers);
    addHighlight('fielding', `A spectacular diving catch by ${fielder.name.split(' ').pop()} turned the game around.`);
  } else {
    const bowler = randomBowler(loserPlayers);
    addHighlight('bowling', `${bowler.name.split(' ').pop()} took ${randInt(2, 4)} wickets but couldn't stop ${winner.short}.`);
  }

  // 3. Margin/Ending Highlight
  if (marginStr.includes('runs')) {
    const runs = parseInt(marginStr.replace(/[^0-9]/g, ''));
    if (runs < 10) addHighlight('clutch', `An absolute nail-biter! ${winner.short} squeezed out a win by ${runs} runs.`);
    else if (runs > 50) addHighlight('team', `${winner.short} completely dominated, securing a massive ${runs}-run victory.`);
  } else {
    const wkts = parseInt(marginStr.replace(/[^0-9]/g, ''));
    if (wkts >= 8) addHighlight('team', `A clinical chase! ${winner.short} cruised to victory by ${wkts} wickets.`);
    else if (wkts <= 3) addHighlight('clutch', `A tense finish as ${winner.short} chased it down with just ${wkts} wickets remaining.`);
  }

  // 4. Occasional Milestone (20% chance)
  if (rng() > 0.8) {
    const batter = randomBatter(winnerPlayers);
    addHighlight('milestone', `${batter.name.split(' ').pop()} reached a personal milestone during this brilliant innings.`);
  }

  return highlights;
}

// --- Simulate one T20 match ---
import type { MatchPrepConfig, RainEvent } from './types';

export function simulateMatch(teamA: SeasonTeam, teamB: SeasonTeam, playersPool: Player[], userSquad: SquadSlot[], playerForms?: Record<number, PlayerForm>, matchPrep?: MatchPrepConfig, rosterA?: Player[], rosterB?: Player[]): MatchResult {
  // ── Rain / DLS check (very rare: ~3% chance) ──────────────────
  const rainRoll = rng();
  let rainEvent: RainEvent | undefined;

  if (rainRoll < 0.015 && !matchPrep?.isPlayoff) {
    // Match abandoned — No Result (~1.5%)
    rainEvent = {
      type: 'abandoned',
      description: 'Match abandoned due to persistent rain. No result. Each team awarded 1 point.',
    };
    const isUserMatch = teamA.short === 'YOUR XI' || teamB.short === 'YOUR XI';
    return {
      homeTeam: teamA.name,
      awayTeam: teamB.name,
      homeScore: 'N/A',
      awayScore: 'N/A',
      winner: 'No Result',
      margin: 'Match abandoned (rain)',
      isUserMatch,
      userWon: false,
      rainEvent,
    };
  } else if (rainRoll < 0.045) {
    // DLS — overs reduced (~1.5-4.5% band = ~3% of matches)
    rainEvent = {
      type: 'dls_reduced',
      description: 'Rain interruption — overs reduced. Result determined by DLS method.',
    };
  }

  // ── Win probability ───────────────────────────────────────────
  // Apply Impact Player Optimization if matchPrep is provided
  let overrideSquad = userSquad;
  let optimizedOverallA = teamA.overall;
  let optimizedOverallB = teamB.overall;

  if (matchPrep) {
    const isUserA = teamA.short === 'YOUR XI';
    const isUserB = teamB.short === 'YOUR XI';
    
    if (isUserA || isUserB) {
      // Create temporary squad slots for AI impact optimization
      let bestOverall = -1;
      let bestXI = [...matchPrep.playingXI];

      // Original strength
      const origSlots = matchPrep.playingXI.map(p => ({ player: p } as SquadSlot));
      const origStrength = calcSquadStrength(origSlots).overall;
      bestOverall = origStrength;

      // Try replacing each player with a bench player
      for (let i = 0; i < 11; i++) {
        for (const benchPlayer of matchPrep.impactBench) {
          const tempXI = [...matchPrep.playingXI];
          tempXI[i] = benchPlayer;
          
          // Enforce 4 overseas rule
          const overseasCount = tempXI.filter(p => p.is_overseas).length;
          if (overseasCount > 4) continue;

          const tempSlots = tempXI.map(p => ({ player: p } as SquadSlot));
          const tempStrength = calcSquadStrength(tempSlots).overall;
          if (tempStrength > bestOverall) {
            bestOverall = tempStrength;
            bestXI = tempXI;
          }
        }
      }

      if (isUserA) {
        optimizedOverallA = bestOverall;
        overrideSquad = bestXI.map(p => ({ player: p } as SquadSlot));
      }
      if (isUserB) {
        optimizedOverallB = bestOverall;
        overrideSquad = bestXI.map(p => ({ player: p } as SquadSlot));
      }
    }
  }

  function getMomentumBonus(streak: number = 0) {
    if (streak >= 12) return 4;
    if (streak >= 9) return 3;
    if (streak >= 6) return 2;
    if (streak >= 3) return 1;
    return 0;
  }
  
  function getGaussianNoise(sigma: number) {
    let u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return num * sigma;
  }

  function getRiskVariance(riskProfile?: string) {
    if (riskProfile === 'High-Risk') return getGaussianNoise(0.05);
    if (riskProfile === 'Blitz') return getGaussianNoise(0.10);
    if (riskProfile === 'Balanced') return getGaussianNoise(0.02);
    return 0; // Safe
  }

  let effOvrA = optimizedOverallA + getMomentumBonus(teamA.streak) + (teamA.captain ? 1 : 0) + 1; // +1 Home Advantage for Team A
  let effOvrB = optimizedOverallB + getMomentumBonus(teamB.streak) + (teamB.captain ? 1 : 0);

  const diffA = effOvrA - effOvrB;
  // Apply form bonus only when the user's team is involved
  let formBonus = 0;
  if (playerForms && (teamA.short === 'YOUR XI' || teamB.short === 'YOUR XI')) {
    const bonus = calcSquadFormBonus(playerForms);
    formBonus = teamA.short === 'YOUR XI' ? bonus : -bonus;
  }

  let winProbA = 0.5 + diffA * 0.03 + formBonus;
  
  let clutchTriggered: string | undefined = undefined;
  // Clutch Player Mechanic: if tight game (40%-60% win prob)
  if (winProbA >= 0.4 && winProbA <= 0.6) {
    // simplified: just a 5% chance per team if they are in a tight spot
    if (rng() < 0.05) {
      clutchTriggered = teamA.name;
      winProbA = 1.0;
    } else if (rng() < 0.05) {
      clutchTriggered = teamB.name;
      winProbA = 0.0;
    }
  }

  if (!clutchTriggered) {
    // Add risk variance
    winProbA += getRiskVariance(teamA.riskProfile) - getRiskVariance(teamB.riskProfile);
    winProbA = Math.max(0, Math.min(1, winProbA)); // clamp
  }

  let aWins = rng() < winProbA;

  let destinyTriggered = false;
  // Perfect Season Protection
  if (teamA.played === 15 && teamA.won === 15 && !aWins && !teamA.hasDestinyUsed) {
    if (rng() < 0.20) {
      aWins = true;
      destinyTriggered = true;
    }
  } else if (teamB.played === 15 && teamB.won === 15 && aWins && !teamB.hasDestinyUsed) {
    if (rng() < 0.20) {
      aWins = false;
      destinyTriggered = true;
    }
  }

  const winner = aWins ? teamA : teamB;
  const loser = aWins ? teamB : teamA;

  const isUserMatch = teamA.short === 'YOUR XI' || teamB.short === 'YOUR XI';
  const userWon = isUserMatch && winner.short === 'YOUR XI';

  // ── Determine if DLS match ───────────────────────────────────
  const isDLS = !!rainEvent; // type === 'dls_reduced'
  const dlsOvers = isDLS ? randInt(11, 18) : 20; // reduced-over game

  // ── Generate innings scores ──────────────────────────────────
  const margin = rng() > 0.45; // true = won by runs, false = by wickets

  // Helper: overs string — can be less than 20 when all-out
  const oversStr = (wickets: number, maxOvers: number): string => {
    if (wickets >= 10) {
      // Team all out — could be any over from (maxOvers-8) to maxOvers
      const allOutOver = Math.max(7, randInt(maxOvers - 8, maxOvers - 1));
      const balls = randInt(0, 5);
      return balls > 0 ? `${allOutOver}.${balls}` : `${allOutOver}`;
    }
    return `${maxOvers}`;
  };

  let homeScore: string;
  let awayScore: string;
  let marginStr: string;

  if (margin) {
    // Winner batted first, won by runs
    const winnerRuns = randInt(isDLS ? 110 : 140, isDLS ? 170 : 220);
    const winnerWickets = randInt(3, 9);
    const loserRuns = winnerRuns - randInt(5, 35);
    const loserWickets = randInt(7, 10);

    const winnerOvers = oversStr(winnerWickets, dlsOvers);
    const loserOvers = oversStr(loserWickets, dlsOvers);

    const diffRuns = winnerRuns - loserRuns;
    marginStr = isDLS
      ? `by ${diffRuns} runs (DLS)`
      : `by ${diffRuns} runs`;

    if (teamA === winner) {
      homeScore = `${winnerRuns}/${winnerWickets} (${winnerOvers})`;
      awayScore = `${loserRuns}/${loserWickets} (${loserOvers})`;
    } else {
      homeScore = `${loserRuns}/${loserWickets} (${loserOvers})`;
      awayScore = `${winnerRuns}/${winnerWickets} (${winnerOvers})`;
    }
  } else {
    // Winner chased, won by wickets
    const loserRuns = randInt(isDLS ? 100 : 130, isDLS ? 155 : 190);
    const loserWickets = randInt(7, 10);

    // Winner gets fewer than maxOvers if won before finishing
    const winnerRuns = loserRuns + randInt(1, 10);
    const winnerWickets = randInt(1, 8);
    const wicketsLeft = 10 - winnerWickets;

    // Overs used in chase — some balls to spare
    const oversUsed = Math.max(5, randInt(dlsOvers - 6, dlsOvers - 1));
    const ballsUsed = randInt(0, 5);
    const winnerOversStr = ballsUsed > 0 ? `${oversUsed}.${ballsUsed}` : `${oversUsed}`;

    const loserOvers = oversStr(loserWickets, dlsOvers);

    marginStr = isDLS
      ? `by ${wicketsLeft} wickets (DLS)`
      : `by ${wicketsLeft} wickets`;

    if (teamA === winner) {
      homeScore = `${winnerRuns}/${winnerWickets} (${winnerOversStr})`;
      awayScore = `${loserRuns}/${loserWickets} (${loserOvers})`;
    } else {
      homeScore = `${loserRuns}/${loserWickets} (${loserOvers})`;
      awayScore = `${winnerRuns}/${winnerWickets} (${winnerOversStr})`;
    }
  }

  const teamAPlayers = rosterA && rosterA.length > 0 
    ? rosterA 
    : (teamA.short === 'YOUR XI' ? overrideSquad.filter(s => s.player).map(s => s.player!) : playersPool.filter(p => p.team === teamA.short));
  const teamBPlayers = rosterB && rosterB.length > 0 
    ? rosterB 
    : (teamB.short === 'YOUR XI' ? overrideSquad.filter(s => s.player).map(s => s.player!) : playersPool.filter(p => p.team === teamB.short));

  const winnerRoster = winner === teamA ? teamAPlayers : teamBPlayers;
  const loserRoster = winner === teamA ? teamBPlayers : teamAPlayers;

  const motm = generateMotm(winner, playersPool, overrideSquad, winnerRoster);
  const highlights = generateHighlights(winner, loser, marginStr, motm, playersPool, overrideSquad, winnerRoster, loserRoster);

  const parseScore = (scoreStr: string) => {
    if (scoreStr === 'N/A') return { runs: 0, wickets: 0 };
    const m = scoreStr.match(/(\d+)\/(\d+)/);
    if (m) return { runs: parseInt(m[1]), wickets: parseInt(m[2]) };
    const m2 = scoreStr.match(/(\d+) \(/);
    if (m2) return { runs: parseInt(m2[1]), wickets: 10 };
    return { runs: 0, wickets: 0 };
  };
  const homeStats = parseScore(homeScore);
  const awayStats = parseScore(awayScore);

  const matchStats: Record<number, PlayerStats> = {};
  
  const generateTeamStats = (players: Player[], runsScored: number, wicketsTaken: number, won: boolean, isUserTeam: boolean) => {
    let runsLeft = runsScored;
    let wicketsLeft = wicketsTaken;

    const batters = [...players].sort((a, b) => b.overall - a.overall);
    const bowlers = [...players].filter(p => p.role.includes('BOWL') || p.role === 'AR').sort((a, b) => b.overall - a.overall);

    players.forEach(p => {
      let runs = 0;
      let balls = 0;
      let wickets = 0;
      let economy = (rng() * 4 + 6);

      if (motm && motm.player.id === p.id) {
        runs = motm.runs || 0;
        balls = motm.balls || 0;
        wickets = motm.wickets || 0;
      } else {
        if (runsLeft > 0 && batters.includes(p)) {
          runs = Math.min(runsLeft, randInt(0, 40));
          balls = Math.floor(runs / ((p.overall * 1.5 + randFloat(0, 20)) / 100));
        }
        if (wicketsLeft > 0 && bowlers.includes(p)) {
          wickets = Math.min(wicketsLeft, randInt(0, 3));
        }
      }
      
      runsLeft -= runs;
      wicketsLeft -= wickets;

      let mvpScore = runs + (wickets * 25);
      if (won) mvpScore += 10;
      if (motm && motm.player.id === p.id) mvpScore += 50;
      if (rng() > 0.8) mvpScore += randInt(0, 10);
      const pLastName = p.name.split(' ').pop() || p.name;
      if (highlights.find(h => h.category === 'clutch' && h.text.includes(pLastName))) mvpScore += 20;

      matchStats[p.id] = {
        runs,
        strikeRate: balls > 0 ? Math.round((runs / balls) * 100) : 0,
        wickets,
        economy: parseFloat(economy.toFixed(2)),
        mvpScore,
        name: p.name,
        team: p.team,
        isUserTeam
      };
    });
  };

  generateTeamStats(teamAPlayers, homeStats.runs, awayStats.wickets, teamA === winner, teamA.short === 'YOUR XI');
  generateTeamStats(teamBPlayers, awayStats.runs, homeStats.wickets, teamB === winner, teamB.short === 'YOUR XI');
  function getMomentumState(streak: number = 0) {
    if (streak >= 12) return 'Dynasty Mode';
    if (streak >= 9) return 'Championship Form';
    if (streak >= 6) return 'Hot Streak (Tier 2)';
    if (streak >= 3) return 'Hot Streak (Tier 1)';
    return undefined;
  }

  return {
    homeTeam: teamA.name,
    awayTeam: teamB.name,
    homeScore,
    awayScore,
    winner: winner.name,
    margin: marginStr,
    isUserMatch,
    userWon,
    motm,
    highlights,
    rainEvent,
    matchStats,
    clutchTriggered,
    destinyTriggered,
    momentumStateA: getMomentumState(teamA.streak),
    momentumStateB: getMomentumState(teamB.streak),
    homeFortressBonus: teamA.name, // Team A is assumed to be home team in simulateMatch
  };
}

// --- Generate all league fixtures ---
// IPL format: 10 teams split into 2 groups of 5, each plays exactly 14 matches = 70 total
//
// Schedule per team:
//   Intra-group  : 4 opponents × 2 (home + away)  =  8 matches
//   Inter-group  : 4 opponents × 1                =  4 matches
//                  1 opponent  × 2 (home + away)  =  2 matches   (random)
//                                                 -----------
//                                         TOTAL   = 14 matches
//
// The "double" inter-group opponent for each team-pair is chosen randomly
// but symmetrically (if A plays B twice, B plays A twice).
export function generateFixtures(teams: SeasonTeam[]): [number, number][] {
  const n = teams.length; // must be 10
  const allFixtures: [number, number][] = [];

  // ── Step 1: Assign groups randomly ────────────────────────
  // Shuffle team indices, first 5 → Group A, last 5 → Group B
  const indices = Array.from({ length: n }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const groupA = indices.slice(0, 5);
  const groupB = indices.slice(5, 10);

  // ── Step 2: Intra-group fixtures (home + away for each pair) ─
  const addDouble = (a: number, b: number) => {
    allFixtures.push([a, b]);
    allFixtures.push([b, a]);
  };
  const addSingle = (a: number, b: number) => {
    // Randomly decide which side is home
    if (rng() < 0.5) allFixtures.push([a, b]);
    else allFixtures.push([b, a]);
  };

  for (let i = 0; i < groupA.length; i++) {
    for (let j = i + 1; j < groupA.length; j++) {
      addDouble(groupA[i], groupA[j]);
    }
  }
  for (let i = 0; i < groupB.length; i++) {
    for (let j = i + 1; j < groupB.length; j++) {
      addDouble(groupB[i], groupB[j]);
    }
  }

  // ── Step 3: Inter-group fixtures ─────────────────────────
  // Each team in Group A faces each team in Group B.
  // For each of the 5×5 = 25 cross-group pairs we need to decide:
  //   - 4 of Group-A's opponents in Group-B are played once (→ 4 singles)
  //   - 1 of Group-A's opponents in Group-B is played twice (→ 1 double)
  // This must be consistent: if A→B is a double, B also uses that as its double with A.
  //
  // Approach: build a 5×5 bipartite matching where each node has exactly
  // one "double" edge and four "single" edges, i.e. a perfect matching.
  // A simple way: create a random permutation mapping groupA[i] → groupB[perm[i]]
  // as the "double" pairs.
  const permB = [...groupB].sort(() => rng() - 0.5);
  // permB[i] is the Group-B team that plays GroupA[i] twice

  for (let i = 0; i < 5; i++) {
    const teamA = groupA[i];
    const doubleOpponent = permB[i];

    for (let j = 0; j < 5; j++) {
      const teamB = groupB[j];
      if (teamB === doubleOpponent) {
        addDouble(teamA, teamB); // play twice
      } else {
        addSingle(teamA, teamB); // play once
      }
    }
  }

  // ── Step 4: Shuffle all fixtures ─────────────────────────
  for (let i = allFixtures.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [allFixtures[i], allFixtures[j]] = [allFixtures[j], allFixtures[i]];
  }

  return allFixtures;
}

// --- Update standings after match ---
export function applyResult(teams: SeasonTeam[], aIdx: number, bIdx: number, result: MatchResult) {
  const a = teams[aIdx];
  const b = teams[bIdx];

  a.played++;
  b.played++;

  if (result.rainEvent?.type === 'abandoned') {
    // No result — each team gets 1 point, NRR unchanged
    a.points += 1;
    b.points += 1;
    // Streaks remain unchanged or reset? Let's keep them unchanged for abandoned.
  } else {
    let nrrA = result.nrrModifierA;
    let nrrB = result.nrrModifierB;

    if (nrrA === undefined || nrrB === undefined) {
      if (result.winner === a.name) {
        nrrA = parseFloat((randFloat(0.1, 0.8)).toFixed(3));
        nrrB = -parseFloat((randFloat(0.1, 0.5)).toFixed(3));
      } else {
        nrrB = parseFloat((randFloat(0.1, 0.8)).toFixed(3));
        nrrA = -parseFloat((randFloat(0.1, 0.5)).toFixed(3));
      }
      result.nrrModifierA = nrrA;
      result.nrrModifierB = nrrB;
    }

    if (result.winner === a.name) {
      a.won++;
      a.points += 2;
      b.lost++;
      a.streak = (a.streak || 0) + 1;
      b.streak = 0;
    } else {
      b.won++;
      b.points += 2;
      a.lost++;
      b.streak = (b.streak || 0) + 1;
      a.streak = 0;
    }

    a.nrr += nrrA;
    b.nrr += nrrB;
  }

  // Update Destiny Usage
  if (result.destinyTriggered) {
    if (result.winner === a.name) {
      a.hasDestinyUsed = true;
    } else {
      b.hasDestinyUsed = true;
    }
  }
}

export function accumulateStats(seasonStats: Record<number, PlayerStats>, matchStats?: Record<number, PlayerStats>) {
  if (!matchStats) return;
  Object.entries(matchStats).forEach(([idStr, stats]) => {
    const id = parseInt(idStr);
    const prev = seasonStats[id] || { runs: 0, wickets: 0, economy: 0, strikeRate: 0, mvpScore: 0, name: stats.name, team: stats.team, isUserTeam: stats.isUserTeam };
    
    const ballsFacedPrev = prev.strikeRate > 0 ? (prev.runs / prev.strikeRate) * 100 : 0;
    const ballsFacedNew = stats.strikeRate > 0 ? (stats.runs / stats.strikeRate) * 100 : 0;
    const newTotalRuns = prev.runs + stats.runs;
    const newTotalBalls = ballsFacedPrev + ballsFacedNew;
    const newStrikeRate = newTotalBalls > 0 ? (newTotalRuns / newTotalBalls) * 100 : 0;
    
    seasonStats[id] = {
      ...prev,
      runs: newTotalRuns,
      wickets: prev.wickets + stats.wickets,
      strikeRate: newStrikeRate,
      mvpScore: (prev.mvpScore || 0) + (stats.mvpScore || 0)
    };
  });
}

// --- Sort table ---
export function sortTable(teams: SeasonTeam[]): SeasonTeam[] {
  return [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.nrr - a.nrr;
  });
}

function generatePlayoffScore(winnerShort: string, loserShort: string) {
  const winnerBatFirst = rng() > 0.5;
  const runs1 = randInt(160, 225);
  const wkts1 = randInt(3, 8);
  let score1 = `${runs1}/${wkts1}`;
  let score2 = '';
  let margin = '';

  if (winnerBatFirst) {
    const runs2 = runs1 - randInt(5, 30);
    const wkts2 = randInt(5, 10);
    score2 = wkts2 === 10 ? `${runs2}` : `${runs2}/${wkts2}`;
    margin = `${runs1 - runs2} runs`;
    return {
      winnerScore: score1,
      loserScore: score2,
      result: `${winnerShort} won by ${margin}`
    };
  } else {
    const runs2 = runs1 - randInt(1, 15);
    const wkts2 = randInt(4, 9);
    score2 = wkts2 === 10 ? `${runs2}` : `${runs2}/${wkts2}`;
    const wktMargin = 10 - wkts1;
    margin = `${wktMargin} wicket${wktMargin > 1 ? 's' : ''}`;
    return {
      winnerScore: score1,
      loserScore: score2,
      result: `${winnerShort} won by ${margin}`
    };
  }
}

// --- Playoffs ---
export function simulatePlayoffs(top4: SeasonTeam[], playersPool: Player[], userSquad: SquadSlot[], rostersMap?: Record<string, Player[]>): { matches: PlayoffMatch[]; champion: string } {
  const [t1, t2, t3, t4] = top4;

  // Q1: 1st vs 2nd
  const q1WinProb = 0.5 + (t1.overall - t2.overall) * 0.02 + (rng() - 0.5) * 0.3;
  const q1Winner = q1WinProb > 0.5 ? t1 : t2;
  const q1Loser = q1WinProb > 0.5 ? t2 : t1;
  const q1WinnerRoster = rostersMap ? rostersMap[q1Winner.short] : undefined;
  const q1LoserRoster = rostersMap ? rostersMap[q1Loser.short] : undefined;
  const q1Motm = generateMotm(q1Winner, playersPool, userSquad, q1WinnerRoster);
  const q1Score = generatePlayoffScore(q1Winner.short, q1Loser.short);

  const q1: PlayoffMatch = {
    name: 'Qualifier 1',
    team1: t1.short,
    team2: t2.short,
    team1Score: q1Winner === t1 ? q1Score.winnerScore : q1Score.loserScore,
    team2Score: q1Winner === t2 ? q1Score.winnerScore : q1Score.loserScore,
    winner: q1Winner.short,
    result: q1Score.result,
    motm: q1Motm,
    highlights: generateHighlights(q1Winner, q1Loser, 'by a narrow margin', q1Motm, playersPool, userSquad, q1WinnerRoster, q1LoserRoster),
  };

  // Elim: 3rd vs 4th
  const elimWinProb = 0.5 + (t3.overall - t4.overall) * 0.02 + (rng() - 0.5) * 0.3;
  const elimWinner = elimWinProb > 0.5 ? t3 : t4;
  const elimLoser = elimWinProb > 0.5 ? t4 : t3;
  const elimWinnerRoster = rostersMap ? rostersMap[elimWinner.short] : undefined;
  const elimLoserRoster = rostersMap ? rostersMap[elimLoser.short] : undefined;
  const elimMotm = generateMotm(elimWinner, playersPool, userSquad, elimWinnerRoster);
  const elimScore = generatePlayoffScore(elimWinner.short, elimLoser.short);

  const elim: PlayoffMatch = {
    name: 'Eliminator',
    team1: t3.short,
    team2: t4.short,
    team1Score: elimWinner === t3 ? elimScore.winnerScore : elimScore.loserScore,
    team2Score: elimWinner === t4 ? elimScore.winnerScore : elimScore.loserScore,
    winner: elimWinner.short,
    result: elimScore.result,
    motm: elimMotm,
    highlights: generateHighlights(elimWinner, elimLoser, 'by a commanding margin', elimMotm, playersPool, userSquad, elimWinnerRoster, elimLoserRoster),
  };

  // Q2: Q1 loser vs Elim winner
  const q2WinProb = 0.5 + (q1Loser.overall - elimWinner.overall) * 0.02 + (rng() - 0.5) * 0.3;
  const q2Winner = q2WinProb > 0.5 ? q1Loser : elimWinner;
  const q2Loser = q2WinProb > 0.5 ? elimWinner : q1Loser;
  const q2WinnerRoster = rostersMap ? rostersMap[q2Winner.short] : undefined;
  const q2LoserRoster = rostersMap ? rostersMap[q2Loser.short] : undefined;
  const q2Motm = generateMotm(q2Winner, playersPool, userSquad, q2WinnerRoster);
  const q2Score = generatePlayoffScore(q2Winner.short, q2Loser.short);

  const q2: PlayoffMatch = {
    name: 'Qualifier 2',
    team1: q1Loser.short,
    team2: elimWinner.short,
    team1Score: q2Winner === q1Loser ? q2Score.winnerScore : q2Score.loserScore,
    team2Score: q2Winner === elimWinner ? q2Score.winnerScore : q2Score.loserScore,
    winner: q2Winner.short,
    result: q2Score.result,
    motm: q2Motm,
    highlights: generateHighlights(q2Winner, q2Loser, 'in a thriller', q2Motm, playersPool, userSquad, q2WinnerRoster, q2LoserRoster),
  };

  // Final: Q1 winner vs Q2 winner
  const finalWinProb = 0.5 + (q1Winner.overall - q2Winner.overall) * 0.02 + (rng() - 0.5) * 0.3;
  const champion = finalWinProb > 0.5 ? q1Winner : q2Winner;
  const finalLoser = finalWinProb > 0.5 ? q2Winner : q1Winner;
  const championRoster = rostersMap ? rostersMap[champion.short] : undefined;
  const finalLoserRoster = rostersMap ? rostersMap[finalLoser.short] : undefined;
  const finalMotm = generateMotm(champion, playersPool, userSquad, championRoster);
  const finalScore = generatePlayoffScore(champion.short, finalLoser.short);

  const final: PlayoffMatch = {
    name: 'Final',
    team1: q1Winner.short,
    team2: q2Winner.short,
    team1Score: champion === q1Winner ? finalScore.winnerScore : finalScore.loserScore,
    team2Score: champion === q2Winner ? finalScore.winnerScore : finalScore.loserScore,
    winner: champion.short,
    result: finalScore.result,
    motm: finalMotm,
    highlights: generateHighlights(champion, finalLoser, 'in the grand final', finalMotm, playersPool, userSquad, championRoster, finalLoserRoster),
  };

  return {
    matches: [q1, elim, q2, final],
    champion: champion.short,
  };
}

export function generatePlayerStats(squad: SquadSlot[], teamWins: number): Record<number, PlayerStats> {
  const stats: Record<number, PlayerStats> = {};
  const players = squad.filter(s => s.player).map(s => s.player!);
  
  // Tiers to enforce realistic distribution (some perform, some flop)
  const batTiers = [1.3, 1.15, 0.95, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1].sort(() => rng() - 0.5);
  const bowlTiers = [1.3, 1.15, 0.95, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1].sort(() => rng() - 0.5);
  
  players.forEach((p, idx) => {
    let runs = 0;
    let strikeRate = 0;
    let wickets = 0;
    let economy = 0;

    const formFactor = 1 + (teamWins - 7) * 0.02 + (rng() * 0.2 - 0.1);
    const batForm = batTiers[idx] || 0.5;
    const bowlForm = bowlTiers[idx] || 0.5;

    if (p.role === 'BAT' || p.role === 'WK') {
      runs = Math.floor((p.overall * 4.5 + randInt(-50, 100)) * formFactor * batForm);
      strikeRate = p.overall * 1.5 + randFloat(0, 30);
      economy = 0;
    } else if (p.role === 'AR' || p.role === 'BAT_AR' || p.role === 'BOWL_AR') {
      const runMult = p.role === 'BAT_AR' ? 3.5 : p.role === 'BOWL_AR' ? 1.5 : 2.5;
      const wktMult = p.role === 'BAT_AR' ? 0.08 : p.role === 'BOWL_AR' ? 0.22 : 0.15;
      
      runs = Math.floor((p.overall * runMult + randInt(-25, 75)) * formFactor * batForm);
      strikeRate = p.overall * 1.4 + randFloat(-10, 25);
      wickets = Math.floor((p.overall * wktMult + randInt(-2, 4)) * formFactor * bowlForm);
      economy = 12 - (p.overall * 0.04) + randFloat(-1, 1);
    } else if (p.role === 'BOWL') {
      runs = Math.floor((p.overall * 0.5 + randInt(0, 20)) * batForm);
      strikeRate = 100 + randFloat(-20, 40);
      wickets = Math.floor((p.overall * 0.25 + randInt(-2, 6)) * formFactor * bowlForm);
      economy = 11 - (p.overall * 0.045) + randFloat(-1, 1);
    }

    stats[p.id] = {
      runs: Math.max(0, runs),
      strikeRate: Math.max(50, Number(strikeRate.toFixed(1))),
      wickets: Math.max(0, wickets),
      economy: economy > 0 ? Math.max(5.0, Number(economy.toFixed(2))) : 0
    };
  });

  return stats;
}

// --- Generate player awards ---
export function generateAwards(squad: SquadSlot[], pStats: Record<number, PlayerStats>, userTeamShort: string = 'YOUR XI'): Record<string, { player: string; team: string }> {
  const players = squad.filter(s => s.player).map(s => s.player!);
  const getRuns = (id: number) => pStats[id]?.runs || 0;
  const getWickets = (id: number) => pStats[id]?.wickets || 0;

  const topBatter = [...players].sort((a, b) => getRuns(b.id) - getRuns(a.id))[0];
  const topBowler = [...players].sort((a, b) => getWickets(b.id) - getWickets(a.id))[0];
  const topAR = [...players].filter(p => p.role === 'AR').sort((a, b) => {
     const scoreA = getRuns(a.id) / 10 + getWickets(a.id) * 2;
     const scoreB = getRuns(b.id) / 10 + getWickets(b.id) * 2;
     return scoreB - scoreA;
  })[0] || players[0];
  
  const topAll = [...players].sort((a, b) => {
     const scoreA = getRuns(a.id) / 10 + getWickets(a.id) * 2;
     const scoreB = getRuns(b.id) / 10 + getWickets(b.id) * 2;
     return scoreB - scoreA;
  })[0];

  const aiTopRuns = randInt(550, 750);
  const aiTopRunsPick = pick([
    { player: 'Virat Kohli', team: 'RCB' },
    { player: 'David Warner', team: 'DC' },
    { player: 'KL Rahul', team: 'LSG' },
    { player: 'Jos Buttler', team: 'RR' },
    { player: 'Shubman Gill', team: 'GT' },
    { player: 'Faf du Plessis', team: 'RCB' }
  ]);
  
  const aiTopWickets = randInt(22, 30);
  const aiTopWicketsPick = pick([
    { player: 'Mohammed Shami', team: 'GT' },
    { player: 'Kagiso Rabada', team: 'PBKS' },
    { player: 'Yuzvendra Chahal', team: 'RR' },
    { player: 'Rashid Khan', team: 'GT' },
    { player: 'Jasprit Bumrah', team: 'MI' }
  ]);

  const orangeCap = (topBatter && getRuns(topBatter.id) > aiTopRuns) 
    ? { player: topBatter.name, team: userTeamShort } 
    : aiTopRunsPick;

  const purpleCap = (topBowler && getWickets(topBowler.id) > aiTopWickets) 
    ? { player: topBowler.name, team: userTeamShort } 
    : aiTopWicketsPick;

  const aiARScore = randInt(55, 75);
  const aiARPick = pick([
    { player: 'Andre Russell', team: 'KKR' },
    { player: 'Sunil Narine', team: 'KKR' },
    { player: 'Hardik Pandya', team: 'MI' },
    { player: 'Ravindra Jadeja', team: 'CSK' },
    { player: 'Marcus Stoinis', team: 'LSG' }
  ]);
  
  const userARScore = topAR ? getRuns(topAR.id) / 10 + getWickets(topAR.id) * 2 : 0;
  const bestAR = userARScore > aiARScore ? { player: topAR.name, team: userTeamShort } : aiARPick;

  const aiMVPScore = randInt(65, 85);
  const userMVPScore = topAll ? getRuns(topAll.id) / 10 + getWickets(topAll.id) * 2 : 0;
  const potS = userMVPScore > aiMVPScore 
    ? { player: topAll.name, team: userTeamShort } 
    : pick([
        { player: 'Virat Kohli', team: 'RCB' },
        { player: 'Andre Russell', team: 'KKR' },
        { player: 'Jos Buttler', team: 'RR' },
        { player: 'Sunil Narine', team: 'KKR' }
      ]);

  return {
    'Orange Cap': orangeCap,
    'Purple Cap': purpleCap,
    'Best All-Rounder': bestAR,
    'Player of the Season': potS,
  };
}

// --- Season story ---
export function generateStory(
  squad: SquadSlot[],
  userTeam: SeasonTeam,
  finalPos: number,
  projectedPos: number,
  champion: string,
  wins: number,
  losses: number,
  pStats: Record<number, PlayerStats>
): StoryItem[] {
  const players = squad.filter(s => s.player).map(s => s.player!);
  
  // Safe stats lookup to prevent crashes when stats are empty (e.g. in multiplayer fallbacks)
  const getRuns = (id: number) => pStats[id]?.runs || 0;
  const getWickets = (id: number) => pStats[id]?.wickets || 0;

  const topBatter = [...players].sort((a, b) => getRuns(b.id) - getRuns(a.id))[0];
  const topBowler = [...players].sort((a, b) => getWickets(b.id) - getWickets(a.id))[0];

  const overperformed = finalPos < projectedPos;
  const underperformed = finalPos > projectedPos;
  const isChampion = champion?.toUpperCase() === userTeam.short?.toUpperCase();

  const story: StoryItem[] = [];
  let id = 1;
  const add = (type: StoryItem['type'], author: string, text: string) => {
    story.push({ id: `st_${Date.now()}_${id++}`, type, author, text });
  };

  // 1. Headline News
  const newsAuthor = pick([
    'CricInsider',
    'The Daily Yorker',
    'Wisden India',
    'Sky Sports Cricket',
    'Fox Cricket',
    'SuperSport Cricket'
  ]);

  if (isChampion) {
    const templates = [
      `BREAKING: "${userTeam.name}" defy the odds to lift the IPL Trophy! A spectacular dream run completed in historic fashion.`,
      `HISTORY MADE: "${userTeam.name}" crowned IPL Champions after a masterclass season! Fans erupt in celebration.`,
      `🏆 CHAMPIONS! "${userTeam.name}" conquer the league to claim the ultimate prize in an unforgettable final.`
    ];
    add('news', newsAuthor, pick(templates));
  } else if (finalPos <= 4) {
    const templates = [
      `Valiant effort from "${userTeam.name}" comes to an end in the playoffs. They fought hard but missed the ultimate prize.`,
      `Heartbreak in the playoffs as "${userTeam.name}" fall just short of the finals after a spirited campaign.`,
      `Playoff run ends for "${userTeam.name}". A stellar season that promises great things for the future.`
    ];
    add('news', newsAuthor, pick(templates));
  } else if (underperformed) {
    const templates = [
      `A season to forget for "${userTeam.name}". Despite a projected ${ordinal(projectedPos)} finish, they crumbled to ${ordinal(finalPos)}. Changes needed?`,
      `Questions raised after "${userTeam.name}" finish ${ordinal(finalPos)} despite a projected top-tier finish of ${ordinal(projectedPos)}.`,
      `Campaign autopsy begins for "${userTeam.name}" as they slip to ${ordinal(finalPos)} in a disappointing run.`
    ];
    add('news', newsAuthor, pick(templates));
  } else {
    const templates = [
      `"${userTeam.name}" finish ${ordinal(finalPos)} in a rollercoaster season. Building blocks for next year?`,
      `A mixed bag for "${userTeam.name}" as they wrap up their campaign in ${ordinal(finalPos)} place.`,
      `"${userTeam.name}" settle for a ${ordinal(finalPos)}-place finish. Moments of brilliance combined with missed opportunities.`
    ];
    add('news', newsAuthor, pick(templates));
  }

  // 2. Expert Take
  const expertOptions = [
    {
      name: 'Harsha Bhogle',
      high: `You have to admire how this team came together. Winning ${wins} matches is no joke in this league. The chemistry was simply spectacular.`,
      med: `They had their moments, especially during that mid-season streak, but T20 is about consistency. They lacked it when it mattered most.`,
      low: `I don't think they ever found their best combination. Only ${wins} wins tells you everything. Back to the drawing board for them.`
    },
    {
      name: 'Ravi Shastri',
      high: `Unbelievable cricket! ${wins} wins is absolutely clinical. They played like a massive unit and hit the opposition like a tracer bullet!`,
      med: `They put up a real fight in patches, but you can't lose momentum in this tournament. It's a tough pill to swallow!`,
      low: `No energy, no intent! Only ${wins} wins is just not good enough. You've got to stand up and be counted in this arena!`
    },
    {
      name: 'Aakash Chopra',
      high: `Kya kamaal ka pradarshan! ${wins} jeet koi choti baat nahi hai. Is team ne sabhi ko hairaan kar diya hai!`,
      med: `Koshish acchi thi, par jeet ki gaadi thodi patri se utar gayi. Consistency hi is khel ki asli chaabi hai.`,
      low: `Nirashajanak season. Combinations ban nahi paaye, aur ${wins} jeet ke sath safar yahi samapt hota hai.`
    },
    {
      name: 'Nasser Hussain',
      high: `Tactically, they were superb. Securing ${wins} wins shows outstanding leadership and execution of plans under pressure.`,
      med: `They played some decent cricket, but key errors in crucial overs cost them. You simply cannot afford that in the IPL.`,
      low: `A very poor campaign. Only ${wins} wins is a reflection of poor decision-making and failing to adapt to match situations.`
    },
    {
      name: 'Ian Smith',
      high: `What a ride! ${wins} victories in a single season! Absolute blockbuster stuff from start to finish!`,
      med: `They gave us some thrilling finishes, but in the end, they just couldn't cross the line when the pressure was dialed up.`,
      low: `It just never clicked for them, did it? Only ${wins} wins... a really tough pill to swallow for the players and the fans.`
    },
    {
      name: 'Michael Vaughan',
      high: `Fabulous team. Winning ${wins} games in the toughest league in the world is a brilliant achievement. Best team by far.`,
      med: `Some good performances, but overall too inconsistent. You need to win the close games to be a top team here.`,
      low: `Very disappointing. Only ${wins} wins... they need to make some major changes in the squad before the next auction.`
    },
    {
      name: 'Pommie Mbangwa',
      high: `Sensational! Absolutely sensational! ${wins} wins, and they did it with style and absolute authority!`,
      med: `Oh, they entertained us, no doubt! But a few slip-ups here and there proved very costly in the final tally.`,
      low: `A tough run for the boys. Just ${wins} wins... they'll be hurting, but they must pick themselves up and rebuild.`
    }
  ];

  const expert = pick(expertOptions);
  const expertText = wins >= 10 ? expert.high : wins >= 5 ? expert.med : expert.low;
  add('expert', expert.name, expertText);

  // 3. Top Batter Player Quote
  if (topBatter && getRuns(topBatter.id) > 300) {
    const runs = getRuns(topBatter.id);
    const templates = isChampion ? [
      `Gave it my all, and lifting that trophy makes every single run of my ${runs} runs worth it! Incredible team effort. 🏆`,
      `What a feeling! Scoring ${runs} runs is sweet, but being crowned champions with this group is the ultimate dream come true!`
    ] : [
      `Gave it my all out there. Scoring ${runs} runs means little if we don't win the cup, but proud of the effort. We'll be back stronger. 💪`,
      `Gave it my all out there. Personally a good season with ${runs} runs, but team success is what matters. We'll learn from this.`
    ];
    add('player', topBatter.name, pick(templates));
  }

  // 4. Top Bowler Player Quote
  if (topBowler && getWickets(topBowler.id) > 10) {
    if (topBowler.id !== topBatter?.id) {
      const wickets = getWickets(topBowler.id);
      const templates = isChampion ? [
        `Championship gold! ${wickets} wickets for the team... so proud of the boys. Thanks to all the fans for believing in us! 🥇`,
        `The ball was coming out beautifully all season, but winning the cup is the real prize. ${wickets} wickets to help us lift the trophy!`
      ] : [
        `The ball was coming out nicely this season. ${wickets} wickets for the team... thanks for all the support from the fans!`,
        `Happy with my contribution of ${wickets} wickets, but gutted we couldn't go all the way. We'll work harder for the next season.`
      ];
      add('player', topBowler.name, pick(templates));
    }
  }

  // 5. Fan Reaction
  const fanAuthor = pick([
    '@CricketCrazyFan',
    '@IPLMemes',
    '@StatsNerdIPL',
    '@TheBarmyArmy',
    '@OzCricketFan',
    '@WindiesJalapeno',
    '@SaffasFanZone'
  ]);

  if (isChampion) {
    const templates: Record<string, string> = {
      '@CricketCrazyFan': `I was there when we drafted them and I'm here when we won it all! WHAT A TEAM!! 🏆🔥 BEST XI EVER!`,
      '@IPLMemes': `WE ACTUALLY DID IT! Champions of IPL! 🏆 Let the celebrations begin! #IPL #Champions #BestTeam`,
      '@StatsNerdIPL': `100% deserved. The stats favored them throughout the tournament and they executed perfectly in the playoffs. Outstanding.`,
      '@TheBarmyArmy': `Absolute class! Champions of the league! Sing your hearts out! 🎵🏆 #Champions`,
      '@OzCricketFan': `Unstoppable force. Played the best brand of cricket and took home the silverware. Congrats! 🇦🇺💪`,
      '@WindiesJalapeno': `Pure vibes and pure dominance! What a tournament, champions baby! 🌴🥁🏆`,
      '@SaffasFanZone': `A masterclass campaign! So proud of the team spirit and fight they showed. Champions! 🇿🇦🔥`
    };
    add('fan', fanAuthor, templates[fanAuthor] || `IPL Champions! Absolutely amazing season. Well deserved!`);
  } else if (overperformed && !isChampion) {
    const templates: Record<string, string> = {
      '@CricketCrazyFan': `Nobody gave us a chance before the season. Finishing ${ordinal(finalPos)} is a massive achievement. Heads held high!`,
      '@IPLMemes': `From predicted bottom of the table to ${ordinal(finalPos)} place! What a rollercoaster! 🎢😂 #Respect`,
      '@StatsNerdIPL': `Statistically overperformed their projected finish of ${ordinal(projectedPos)} to end up ${ordinal(finalPos)}. Credit to the management.`,
      '@TheBarmyArmy': `A brilliant effort to finish ${ordinal(finalPos)}! Heads high, you've done us proud! 👏`,
      '@OzCricketFan': `Fought above their weight class all season. Ending up ${ordinal(finalPos)} is a great effort.`,
      '@WindiesJalapeno': `Showed some real character! Nobody expected ${ordinal(finalPos)} place. Keep dancing! 🕺💃`,
      '@SaffasFanZone': `Exceeded all expectations to finish ${ordinal(finalPos)}. A wonderful season to build on.`
    };
    add('fan', fanAuthor, templates[fanAuthor] || `Great season! Proud of how the team performed.`);
  } else {
    const templates: Record<string, string> = {
      '@CricketCrazyFan': `Another year, another heartbreak. Why do we keep making the same mistakes? 😭😭😭`,
      '@IPLMemes': `Expectations: 🏆. Reality: ${ordinal(finalPos)} place. Time to turn off the notifications. 💀 #SadLife`,
      '@StatsNerdIPL': `Finished ${ordinal(finalPos)} when projected ${ordinal(projectedPos)}. Negative variance in key close matches. Re-evaluation needed.`,
      '@TheBarmyArmy': `Well, that didn't go to plan, did it? Gutted with the result but we'll stand by the boys. 💔`,
      '@OzCricketFan': `A tough campaign. Let's be honest, finishing ${ordinal(finalPos)} is way below where we should be.`,
      '@WindiesJalapeno': `Tough times, man. A disappointing season ending at ${ordinal(finalPos)}. We need some magic next year. 🪄`,
      '@SaffasFanZone': `Heartbreaking finish. Ending at ${ordinal(finalPos)} is painful, but we will return stronger.`
    };
    add('fan', fanAuthor, templates[fanAuthor] || `Tough season. Hard luck, we'll try again next year.`);
  }

  return story;
}

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// --- Initials from name ---
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
