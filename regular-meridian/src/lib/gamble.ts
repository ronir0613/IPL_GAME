import type { Player, SquadSlot, GamblePhilosophy, GambleSpecialEvent } from './types';

export interface GambleResult {
  philosophy: GamblePhilosophy;
  specialEvent: GambleSpecialEvent;
  squad: SquadSlot[];
  projectedRecord: string;
  strengths: string[];
  weaknesses: string[];
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Ensure a legal XI: 1 WK, 4 BAT, 2 AR, 4 BOWL (example baseline)
// We will allow variations (e.g. 5 BAT, 1 AR)
function draftLegalXI(
  pool: Player[],
  wkTarget: number = 1,
  batTarget: number = 4,
  arTarget: number = 2,
  bowlTarget: number = 4,
  filterFn?: (p: Player) => boolean,
  sortFn?: (a: Player, b: Player) => number
): Player[] {
  let available = filterFn ? pool.filter(filterFn) : [...pool];
  
  if (sortFn) {
    available.sort(sortFn);
  } else {
    available = shuffle(available);
  }

  const wkPool = available.filter(p => p.role === 'WK');
  const batPool = available.filter(p => p.role === 'BAT' || p.role === 'BAT_AR');
  const arPool = available.filter(p => p.role === 'AR');
  const bowlPool = available.filter(p => p.role === 'BOWL' || p.role === 'BOWL_AR');

  const selected: Player[] = [];
  let overseasCount = 0;
  
  // Helper to pick from a specific pool without duplicates
  const pick = (source: Player[], count: number) => {
    let picked = 0;
    for (const p of source) {
      if (picked >= count) break;
      if (!selected.find(s => s.name.toLowerCase().trim() === p.name.toLowerCase().trim())) {
        // Enforce max 4 overseas players rule
        if (p.is_overseas && overseasCount >= 4) {
          continue;
        }
        
        selected.push(p);
        if (p.is_overseas) {
          overseasCount++;
        }
        picked++;
      }
    }
    return picked;
  };

  pick(wkPool, wkTarget);
  pick(batPool, batTarget);
  pick(arPool, arTarget);
  pick(bowlPool, bowlTarget);

  // If we couldn't fulfill the targets exactly (e.g. strict filters), fill with whatever is left to make 11
  if (selected.length < 11) {
    const remaining = available.filter(p => !selected.find(s => s.name.toLowerCase().trim() === p.name.toLowerCase().trim()));
    pick(remaining, 11 - selected.length);
  }

  // If still not 11 (meaning filter was too strict), fill from absolute global pool
  if (selected.length < 11) {
    const globalRemaining = shuffle(pool).filter(p => !selected.find(s => s.name.toLowerCase().trim() === p.name.toLowerCase().trim()));
    pick(globalRemaining, 11 - selected.length);
  }

  return selected;
}

export function generateGambleTeam(playersPool: Player[]): GambleResult {
  const rand = Math.random() * 100;
  
  let specialEvent: GambleSpecialEvent = 'NONE';
  
  if (rand < 0.1) specialEvent = 'THE GOD SQUAD';
  else if (rand < 0.6) specialEvent = 'ALL-TIME XI';
  else if (rand < 1.6) specialEvent = 'JACKPOT TEAM';
  else if (rand < 2.6) specialEvent = 'CURSED TEAM';
  else if (rand < 4.6) specialEvent = 'THE RETIREMENT HOME';
  else if (rand < 6.6) specialEvent = 'THE MEME SQUAD';
  else if (rand < 9.6) specialEvent = 'THE UNDERDOGS';

  let philosophy: GamblePhilosophy = 'BALANCED';
  let drafted: Player[] = [];
  let strengths: string[] = [];
  let weaknesses: string[] = [];
  let projectedRecord = '8-8';

  // Event handlers
  if (specialEvent === 'THE GOD SQUAD') {
    philosophy = 'BALANCED';
    drafted = draftLegalXI(playersPool, 1, 4, 2, 4, p => p.overall >= 90, (a, b) => b.overall - a.overall);
    strengths = ['Literally unbeatable', 'The greatest team ever assembled'];
    weaknesses = ['None'];
    projectedRecord = '16-0';
  } else if (specialEvent === 'ALL-TIME XI' || specialEvent === 'JACKPOT TEAM') {
    philosophy = 'BALANCED';
    drafted = draftLegalXI(playersPool, 1, 4, 2, 4, p => p.overall >= 88, (a, b) => b.overall - a.overall);
    strengths = ['Unstoppable everywhere', 'Literally the Avengers'];
    weaknesses = ['Ego clashes?'];
    projectedRecord = '15-1';
  } else if (specialEvent === 'CURSED TEAM') {
    philosophy = 'MEME TEAM';
    drafted = draftLegalXI(playersPool, 1, 4, 2, 4, p => p.overall < 75, (a, b) => a.overall - b.overall);
    strengths = ['Participation trophies'];
    weaknesses = ['Everything', 'Probably getting relegated'];
    projectedRecord = '1-15';
  } else if (specialEvent === 'THE RETIREMENT HOME') {
    philosophy = 'OLD SCHOOL LEGENDS';
    drafted = draftLegalXI(playersPool, 1, 4, 2, 4, p => p.season <= 2011);
    strengths = ['Experience', 'Nostalgia', 'Classic technique'];
    weaknesses = ['Running between wickets', 'T20 innovation'];
    projectedRecord = '7-9';
  } else if (specialEvent === 'THE UNDERDOGS') {
    philosophy = 'BALANCED';
    drafted = draftLegalXI(playersPool, 1, 4, 2, 4, p => p.overall >= 75 && p.overall <= 81);
    strengths = ['Team chemistry', 'Nothing to lose', 'Scrappy fighters'];
    weaknesses = ['No star power', 'Lack of match winners'];
    projectedRecord = '9-7';
  } else if (specialEvent === 'THE MEME SQUAD') {
    philosophy = 'MEME TEAM';
    drafted = draftLegalXI(playersPool, 1, 5, 0, 5); // 0 allrounders, chaos
    strengths = ['Vibes', 'Content creation', 'Unpredictable'];
    weaknesses = ['Actual cricket strategy', 'Balance'];
    projectedRecord = '5-11';
  } else {
    // Normal Archetype Drafting
    const archRand = Math.random() * 100;
    
    if (archRand < 10) {
      // 10% Superteam (BALANCED but high rating)
      philosophy = 'BALANCED';
      drafted = draftLegalXI(playersPool, 1, 4, 2, 4, p => p.overall >= 85);
      strengths = ['Elite talent in all departments', 'Star power'];
      weaknesses = ['High expectations'];
      projectedRecord = '13-3';
    } else if (archRand < 22) {
      // 12% Flawed - Aggressive Batting (Heavy bat, weak bowl)
      philosophy = 'AGGRESSIVE BATTING';
      const bats = draftLegalXI(playersPool, 1, 6, 1, 3, p => (p.role.includes('BAT') || p.role === 'WK') ? p.overall > 84 : p.overall < 80);
      drafted = bats;
      strengths = ['Explosive batting', 'Chasing massive totals'];
      weaknesses = ['Defending targets', 'Pace attack'];
      projectedRecord = '10-6';
    } else if (archRand < 34) {
      // 12% Flawed - Defensive Bowling (Weak bat, heavy bowl)
      philosophy = 'DEFENSIVE BOWLING';
      const bowls = draftLegalXI(playersPool, 1, 3, 1, 6, p => p.role.includes('BOWL') ? p.overall > 84 : p.overall < 80);
      drafted = bowls;
      strengths = ['Defending low totals', 'Taking wickets in clumps'];
      weaknesses = ['Setting targets', 'Top order collapses'];
      projectedRecord = '9-7';
    } else if (archRand < 44) {
      // 10% Power Hitters
      philosophy = 'POWER HITTERS';
      drafted = draftLegalXI(playersPool, 1, 5, 2, 3, p => p.overall > 80); 
      strengths = ['Six hitting', 'Finishing', 'Entertainment value'];
      weaknesses = ['Rotating strike', 'Spin bowling'];
      projectedRecord = '11-5';
    } else if (archRand < 54) {
      // 10% All Captains
      philosophy = 'ALL CAPTAINS';
      const captainNames = ['Dhoni', 'Kohli', 'Rohit', 'Gambhir', 'Warner', 'Smith', 'Williamson', 'Shreyas', 'Pant', 'Rahul', 'Hardik'];
      drafted = draftLegalXI(playersPool, 1, 4, 2, 4, p => captainNames.some(c => p.name.includes(c)));
      strengths = ['Leadership', 'Experience', 'Tactical brilliance'];
      weaknesses = ['Too many cooks', 'Who takes the final call?'];
      projectedRecord = '12-4';
    } else if (archRand < 66) {
      // 12% All Rounders
      philosophy = 'ALL ROUNDERS';
      drafted = draftLegalXI(playersPool, 1, 2, 6, 2, p => p.overall > 78);
      strengths = ['Depth everywhere', 'Multiple bowling options', 'Batting till 9'];
      weaknesses = ['Specialist skills', 'Top order anchors'];
      projectedRecord = '11-5';
    } else if (archRand < 78) {
      // 12% Pace Battery
      philosophy = 'PACE BATTERY';
      drafted = draftLegalXI(playersPool, 1, 4, 1, 5, p => p.overall > 78); 
      strengths = ['Intimidation', 'Pace and bounce', 'Early wickets'];
      weaknesses = ['Slow pitches', 'Spin options'];
      projectedRecord = '10-6';
    } else if (archRand < 86) {
      // 8% Youth Academy
      philosophy = 'YOUTH ACADEMY';
      drafted = draftLegalXI(playersPool, 1, 4, 2, 4, p => p.season >= 2021);
      strengths = ['Energy', 'Athleticism', 'Fearless approach'];
      weaknesses = ['Inexperience', 'Handling pressure'];
      projectedRecord = '8-8';
    } else if (archRand < 94) {
      // 8% T20 Mercenaries
      philosophy = 'T20 MERCENARIES';
      drafted = draftLegalXI(playersPool, 1, 4, 2, 4, p => !!p.is_overseas && p.overall > 80);
      strengths = ['Global experience', 'Match winners', 'High strike rates'];
      weaknesses = ['Team chemistry', 'Local conditions'];
      projectedRecord = '10-6';
    } else {
      // Remaining 6% - Balanced
      philosophy = 'BALANCED';
      drafted = draftLegalXI(playersPool, 1, 4, 2, 4);
      strengths = ['Good composition', 'Versatility'];
      weaknesses = ['Jack of all trades, master of none'];
      projectedRecord = '8-8';
    }
  }

  // Convert to SquadSlots (a pitch formation approximation)
  // Just use placeholder coordinates for now, DraftScreen positions them anyway based on array index
  const squad: SquadSlot[] = drafted.slice(0, 11).map((p, i) => {
    return {
      position: `P${i+1}`,
      x: 0,
      y: 0,
      player: p
    };
  });

  return {
    philosophy,
    specialEvent,
    squad,
    projectedRecord,
    strengths,
    weaknesses
  };
}
