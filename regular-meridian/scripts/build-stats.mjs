import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureCricsheetCache, parseCsvFile, peopleCsvPath } from './cricsheet-cache.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(projectRoot, 'src', 'data', 'player-stats.json');
const refresh = process.argv.includes('--refresh');
const { matchFiles, downloadDate } = await ensureCricsheetCache({ refresh });
const register = await parseCsvFile(peopleCsvPath);
const registerNames = new Map(register.map((person) => [person.identifier, person.name || person.unique_name || person.identifier]));
const players = new Map();
let matchesProcessed = 0;
let deliveriesProcessed = 0;
let missingRegistryNames = 0;

function getPlayer(identifier) {
  if (!identifier) return null;
  if (!players.has(identifier)) {
    players.set(identifier, {
      matches: new Set(),
      seasons: new Set(),
      batting: {
        innings: 0,
        runs: 0,
        ballsFaced: 0,
        dismissals: 0,
        fifties: 0,
        hundreds: 0,
        highestScore: 0,
        fours: 0,
        sixes: 0,
      },
      bowling: {
        matches: new Set(),
        legalBallsBowled: 0,
        runsConceded: 0,
        wickets: 0,
        bestBowling: null,
        threeWicketHaulsOrBetter: 0,
      },
    });
  }
  return players.get(identifier);
}

function rounded(value) {
  return Number(value.toFixed(2));
}

function registryId(registry, name) {
  const identifier = registry?.[name];
  if (!identifier) missingRegistryNames += 1;
  return identifier || null;
}

const uncreditedDismissals = new Set([
  'run out',
  'retired hurt',
  'retired out',
  'obstructing the field',
  'timed out',
  'handled the ball',
  'hit the ball twice',
]);

for (const filePath of matchFiles.sort()) {
  const match = JSON.parse(await readFile(filePath, 'utf8'));
  const info = match.info;
  if (!info?.registry?.people || !Array.isArray(match.innings)) {
    throw new Error(`Required Cricsheet registry or innings data is missing in ${path.basename(filePath)}.`);
  }

  matchesProcessed += 1;
  const registry = info.registry.people;
  const season = Number.parseInt(String(info.season ?? ''), 10);
  const matchPlayers = new Set();
  for (const teamPlayers of Object.values(info.players ?? {})) {
    for (const name of teamPlayers) {
      const identifier = registryId(registry, name);
      if (identifier) matchPlayers.add(identifier);
    }
  }
  for (const identifier of matchPlayers) {
    const player = getPlayer(identifier);
    player.matches.add(path.basename(filePath));
    if (Number.isFinite(season)) player.seasons.add(season);
  }

  for (const innings of match.innings) {
    if (innings.super_over === true) continue;
    const battingRuns = new Map();
    const bowlingFigures = new Map();

    for (const over of innings.overs ?? []) {
      for (const delivery of over.deliveries ?? []) {
        deliveriesProcessed += 1;
        const batterId = registryId(registry, delivery.batter);
        const bowlerId = registryId(registry, delivery.bowler);
        const batter = getPlayer(batterId);
        const bowler = getPlayer(bowlerId);
        const runs = delivery.runs ?? {};
        const extras = delivery.extras ?? {};
        const batterRuns = Number(runs.batter ?? 0);

        if (batter) {
          if (!battingRuns.has(batterId)) battingRuns.set(batterId, 0);
          battingRuns.set(batterId, battingRuns.get(batterId) + batterRuns);
          batter.batting.runs += batterRuns;
          if (!extras.wides) batter.batting.ballsFaced += 1;
          if (delivery.non_boundary !== true && batterRuns === 4) batter.batting.fours += 1;
          if (delivery.non_boundary !== true && batterRuns === 6) batter.batting.sixes += 1;
        }

        if (bowler) {
          bowler.bowling.matches.add(path.basename(filePath));
          const legal = !extras.wides && !extras.noballs;
          if (legal) bowler.bowling.legalBallsBowled += 1;
          const nonBowlerExtras = Number(extras.byes ?? 0) + Number(extras.legbyes ?? 0) + Number(extras.penalty ?? 0);
          const conceded = Math.max(0, Number(runs.total ?? 0) - nonBowlerExtras);
          bowler.bowling.runsConceded += conceded;
          if (!bowlingFigures.has(bowlerId)) bowlingFigures.set(bowlerId, { runs: 0, wickets: 0 });
          bowlingFigures.get(bowlerId).runs += conceded;
        }

        for (const wicket of delivery.wickets ?? []) {
          const outId = registryId(registry, wicket.player_out);
          const dismissed = getPlayer(outId);
          if (dismissed && wicket.kind !== 'retired hurt') dismissed.batting.dismissals += 1;
          if (bowler && !uncreditedDismissals.has(wicket.kind)) {
            bowler.bowling.wickets += 1;
            bowlingFigures.get(bowlerId).wickets += 1;
          }
        }
      }
    }

    for (const [identifier, score] of battingRuns) {
      const batting = getPlayer(identifier).batting;
      batting.innings += 1;
      batting.highestScore = Math.max(batting.highestScore, score);
      if (score >= 100) batting.hundreds += 1;
      else if (score >= 50) batting.fifties += 1;
    }

    for (const [identifier, figures] of bowlingFigures) {
      const bowling = getPlayer(identifier).bowling;
      if (!bowling.bestBowling || figures.wickets > bowling.bestBowling.wickets ||
        (figures.wickets === bowling.bestBowling.wickets && figures.runs < bowling.bestBowling.runs)) {
        bowling.bestBowling = figures;
      }
      if (figures.wickets >= 3) bowling.threeWicketHaulsOrBetter += 1;
    }
  }
}

const resultPlayers = Object.fromEntries([...players.entries()]
  .filter(([, player]) => player.matches.size > 0)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([identifier, player]) => {
    const batting = player.batting;
    const bowling = player.bowling;
    const dismissed = batting.dismissals;
    const result = {
      matches: player.matches.size,
      firstSeason: player.seasons.size ? Math.min(...player.seasons) : null,
      lastSeason: player.seasons.size ? Math.max(...player.seasons) : null,
      batting: {
        innings: batting.innings,
        runs: batting.runs,
        ballsFaced: batting.ballsFaced,
        dismissals: dismissed,
        average: dismissed > 0 ? rounded(batting.runs / dismissed) : null,
        strikeRate: batting.ballsFaced > 0 ? rounded((batting.runs / batting.ballsFaced) * 100) : null,
        fifties: batting.fifties,
        hundreds: batting.hundreds,
        highestScore: batting.highestScore,
        fours: batting.fours,
        sixes: batting.sixes,
      },
      bowling: {
        matches: bowling.matches.size,
        legalBalls: bowling.legalBallsBowled,
        runsConceded: bowling.runsConceded,
        wickets: bowling.wickets,
        economy: bowling.legalBallsBowled > 0
          ? rounded((bowling.runsConceded * 6) / bowling.legalBallsBowled)
          : null,
        bestBowling: bowling.bestBowling,
        threeWicketHaulsOrBetter: bowling.threeWicketHaulsOrBetter,
      },
    };
    return [identifier, result];
  }));

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify({
  data_version: {
    source: 'Cricsheet IPL JSON',
    sourceUrl: 'https://cricsheet.org/downloads/ipl_json.zip',
    downloadDate,
    generatedAt: new Date().toISOString(),
    matchesProcessed,
  },
  players: resultPlayers,
}, null, 2) + '\n');

const outputSize = (await stat(outputPath)).size;
console.log(`Processed ${matchesProcessed} matches and ${deliveriesProcessed} deliveries; wrote ${Object.keys(resultPlayers).length} player records (${outputSize} bytes).`);
console.log(`Deliveries with unresolved registry names: ${missingRegistryNames}.`);
const namesById = new Map(register.map((person) => [person.identifier, person.unique_name || person.name || person.identifier]));
const topRuns = Object.entries(resultPlayers).sort((a, b) => b[1].batting.runs - a[1].batting.runs).slice(0, 10);
const topWickets = Object.entries(resultPlayers).sort((a, b) => b[1].bowling.wickets - a[1].bowling.wickets).slice(0, 10);
console.log('\nTop IPL run-scorers:');
for (const [identifier, player] of topRuns) console.log(`${namesById.get(identifier) ?? identifier}: ${player.batting.runs}`);
console.log('\nTop IPL wicket-takers:');
for (const [identifier, player] of topWickets) console.log(`${namesById.get(identifier) ?? identifier}: ${player.bowling.wickets}`);
