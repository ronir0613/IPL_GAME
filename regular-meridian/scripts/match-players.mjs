import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureRegisterFiles, namesCsvPath, parseCsvFile, peopleCsvPath } from './cricsheet-cache.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const playerDataPath = path.join(projectRoot, 'public', 'players.json');
const canonicalPath = path.join(projectRoot, 'src', 'lib', 'canonical.ts');
const dataDirectory = path.join(projectRoot, 'src', 'data');
const mapPath = path.join(dataDirectory, 'cricsheet-map.json');
const reviewPath = path.join(dataDirectory, 'cricsheet-review.json');
const overridesPath = path.join(dataDirectory, 'cricsheet-overrides.json');
const refresh = process.argv.includes('--refresh');

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isInitialOnly(value) {
  const parts = normalize(value).split(' ').filter(Boolean);
  return parts.length > 1 && parts.some((part) => part.length === 1);
}

function readCanonicalMap(source) {
  const map = {};
  for (const match of source.matchAll(/['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g)) {
    map[match[1]] = match[2];
  }
  return map;
}

function readOverrides(value) {
  if (value && typeof value === 'object' && value.manualOverrides && typeof value.manualOverrides === 'object') {
    return value.manualOverrides;
  }
  return value && typeof value === 'object' ? value : {};
}

await ensureRegisterFiles({ refresh });
const playerRows = JSON.parse(await readFile(playerDataPath, 'utf8'));
const canonicalSlugs = readCanonicalMap(await readFile(canonicalPath, 'utf8'));
const people = await parseCsvFile(peopleCsvPath);
const aliases = await parseCsvFile(namesCsvPath);
let existingOverrides = {};
try {
  existingOverrides = readOverrides(JSON.parse(await readFile(overridesPath, 'utf8')));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const candidatesByName = new Map();
function addName(name, person, source) {
  const key = normalize(name);
  const identifier = String(person.identifier ?? '').trim();
  if (!key || !identifier) return;
  if (!candidatesByName.has(key)) candidatesByName.set(key, new Map());
  const byIdentifier = candidatesByName.get(key);
  if (!byIdentifier.has(identifier)) {
    byIdentifier.set(identifier, {
      identifier,
      name: person.name || person.unique_name || identifier,
      unique_name: person.unique_name || '',
      sources: new Set(),
    });
  }
  byIdentifier.get(identifier).sources.add(source);
}

for (const person of people) {
  addName(person.name, person, 'people.csv name');
  addName(person.unique_name, person, 'people.csv unique_name');
}
const peopleById = new Map(people.map((person) => [String(person.identifier), person]));
for (const alias of aliases) {
  const person = peopleById.get(String(alias.identifier));
  if (person) addName(alias.name, person, 'names.csv alias');
}

const namesBySlug = new Map();
for (const row of playerRows) {
  if (typeof row.name !== 'string' || row.name.trim() === '') continue;
  const slug = slugify(row.name);
  if (!namesBySlug.has(slug)) namesBySlug.set(slug, new Set());
  namesBySlug.get(slug).add(row.name.trim());
}

function decide(name) {
  const possible = candidatesByName.get(normalize(name));
  if (!possible || possible.size === 0) return { status: 'unmatched', name, candidates: [] };
  const candidateList = [...possible.values()].map((person) => ({
    identifier: person.identifier,
    name: person.name,
    unique_name: person.unique_name,
    matchedAs: [...person.sources].sort(),
  }));
  if (possible.size > 1 || (isInitialOnly(name) && ![...possible.values()].some((person) => person.sources.has('people.csv unique_name')))) {
    return { status: 'ambiguous', name, candidates: candidateList };
  }
  return { status: 'matched', name, identifier: candidateList[0].identifier, candidates: candidateList };
}

const generatedMap = {};
const review = { ambiguous: {}, unmatched: {} };
for (const [slug, names] of namesBySlug) {
  const decisions = [...names].map(decide);
  const acceptedIds = new Set(decisions.filter((item) => item.status === 'matched').map((item) => item.identifier));
  const ambiguous = decisions.filter((item) => item.status === 'ambiguous');
  if (acceptedIds.size === 1 && ambiguous.length === 0) {
    generatedMap[slug] = [...acceptedIds][0];
  } else if (acceptedIds.size > 1 || ambiguous.length > 0) {
    const candidates = new Map();
    for (const item of decisions) {
      for (const candidate of item.candidates) candidates.set(candidate.identifier, candidate);
    }
    review.ambiguous[slug] = { names: [...names].sort(), candidates: [...candidates.values()] };
  } else {
    review.unmatched[slug] = [...names].sort();
  }
}

for (const [duplicateSlug, mainSlug] of Object.entries(canonicalSlugs)) {
  const duplicateId = generatedMap[duplicateSlug];
  const mainId = generatedMap[mainSlug];
  if (duplicateId && mainId && duplicateId !== mainId) {
    const possible = new Map();
    for (const identifier of [duplicateId, mainId]) {
      const person = peopleById.get(identifier);
      if (person) possible.set(identifier, {
        identifier,
        name: person.name,
        unique_name: person.unique_name,
        matchedAs: ['canonical-pair conflict'],
      });
    }
    delete generatedMap[duplicateSlug];
    delete generatedMap[mainSlug];
    review.ambiguous[duplicateSlug] = { names: [...(namesBySlug.get(duplicateSlug) ?? [])], candidates: [...possible.values()] };
    review.ambiguous[mainSlug] = { names: [...(namesBySlug.get(mainSlug) ?? [])], candidates: [...possible.values()] };
  } else if (duplicateId || mainId) {
    const sharedId = mainId || duplicateId;
    generatedMap[mainSlug] = sharedId;
    generatedMap[duplicateSlug] = sharedId;
    delete review.ambiguous[mainSlug];
    delete review.ambiguous[duplicateSlug];
    delete review.unmatched[mainSlug];
    delete review.unmatched[duplicateSlug];
  }
}

for (const [slug, identifier] of Object.entries(existingOverrides)) {
  const canonicalSlug = canonicalSlugs[slug] ?? slug;
  const existing = existingOverrides[canonicalSlug];
  if (existing && existing !== identifier) {
    throw new Error(`Conflicting manual overrides exist for canonical player slug ${canonicalSlug}.`);
  }
}

const sortedMap = Object.fromEntries(Object.entries(generatedMap).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(mapPath, JSON.stringify(sortedMap, null, 2) + '\n');
await writeFile(reviewPath, JSON.stringify({
  ambiguous: Object.fromEntries(Object.entries(review.ambiguous).sort(([a], [b]) => a.localeCompare(b))),
  unmatched: Object.fromEntries(Object.entries(review.unmatched).sort(([a], [b]) => a.localeCompare(b))),
}, null, 2) + '\n');

const ambiguousCount = Object.keys(review.ambiguous).length;
const unmatchedCount = Object.keys(review.unmatched).length;
console.log(`Player slugs from players.json: ${namesBySlug.size}`);
console.log(`Auto-matched slugs: ${Object.keys(sortedMap).length}`);
console.log(`Ambiguous slugs for review: ${ambiguousCount}`);
console.log(`Unmatched slugs: ${unmatchedCount}`);
console.log(`Existing manual overrides preserved: ${Object.keys(existingOverrides).length}`);
