# Phase 2 Report: Cricsheet Player Career Statistics

## Summary

- Added a build-time pipeline that downloads Cricsheet's IPL JSON archive and player register into an ignored local cache.
- Computed career records from 1,243 matches and 295,557 deliveries, excluding super overs.
- Matched 623 player slugs to stable Cricsheet identifiers; uncertain and unmatched names are kept out of stats display.
- Added static batting tables and qualifying bowling tables to matched player pages, plus deterministic factual introductions and source credit.
- The generated stats data is 520,068 bytes; the Astro production build completed with 1,056 pages.
- No protected game logic or player data files were modified.

## Phase 1 verification

The Phase 1 report matched the inspected files: `src/lib/canonical.ts`, `src/components/AdSlot.astro`, and the `Layout.astro` canonical/showAds behavior are present. The ten canonical duplicate slugs are configured. No Phase 1 mismatch was found.

## Cricsheet sources, licensing, and data date

- IPL ball-by-ball JSON archive: [Cricsheet downloads](https://cricsheet.org/downloads/) links to `https://cricsheet.org/downloads/ipl_json.zip`.
- Player register: [Cricsheet Register](https://cricsheet.org/register/) links to `https://cricsheet.org/register/people.csv` and `names.csv`.
- The Register page identifies the people register as Open Data Commons Attribution (ODC-BY) 1.0 and requires attribution and preservation of the license notice for the register and derived works. The pages reviewed do not establish a specific license for the ball-by-ball match archive, so this report does not apply the register's license to match data.
- Attribution on player pages identifies Cricsheet as the match-data source and links the Register/license separately.
- Download date in generated metadata: 2026-09-29. The dataset contains 1,243 IPL matches.

## Files created

- `scripts/cricsheet-cache.mjs` — downloads the archive and two CSV files to `.cache/cricsheet/`, with a refresh option and no new dependency.
- `scripts/match-players.mjs` — normalizes and matches project slugs to Cricsheet identifiers; records ambiguous and unmatched cases for review.
- `scripts/build-stats.mjs` — computes per-player stats from the cached match JSON.
- `src/data/cricsheet-map.json` — 623 automatically accepted slug-to-ID matches.
- `src/data/cricsheet-review.json` — ambiguous and unmatched cases.
- `src/data/cricsheet-overrides.json` — separate manual override map; currently empty.
- `src/data/player-stats.json` — generated IPL stats keyed by Cricsheet ID, including `data_version` metadata.
- `src/lib/playerStats.ts` — typed helpers for resolving stats through slugs, canonical slugs, and manual overrides.
- `agent-notes/phase-2-report.md` — this report.

## Files modified

- `.gitignore` — ignores `.cache/cricsheet/` so downloaded source files stay out of Git.
- `package.json` — adds `build:stats`; it is not part of `npm run build`.
- `src/pages/players/[slug].astro` — renders static career summaries and tables only when a high-confidence player match exists.

## Files intentionally NOT touched

- Protected data: `public/players.json`, `public/ipl_v10_FINAL.json`, `public/overseas_players.json`, `public/roles.json`, and `public/auction_*.json`.
- Protected logic: `src/lib/engine.ts`, `multiplayer.ts`, `pusher.ts`, `gamble.ts`, `form.ts`, `profile.ts`, `App.tsx`, and `MpScreens.tsx`.
- `src/components/PlayerProfile.tsx` and all ad placement components/settings.
- The unrelated pre-existing untracked `D:\IPL_GAME\directory_graph.txt` was preserved.

## Statistics definitions and choices

- Matches played count appearances in `info.players`; seasons come from `info.season`.
- Batting uses the striker's registry ID. Runs are batter runs; balls faced exclude wides. Innings count when the player faces a delivery. Dismissals count player-out events. Average is null with no dismissals; strike rate is null with no balls faced. Fifties and hundreds are per-innings thresholds; highest score, fours, and sixes are summed from delivery records.
- Bowling uses the bowler's registry ID. Legal balls exclude wides and no-balls. Runs conceded include batter runs, wides, and no-balls, while byes and leg-byes are excluded. Wickets exclude run out, retired hurt, retired out, and obstructing the field. Economy uses legal balls / 6; best bowling is wickets/runs in an innings; a haul is at least three wickets in an innings.
- Super-over innings are omitted from batting and bowling totals. Match appearances and seasons still count from the match's player list, including any appearance only in a super over. This avoids attributing extra-short tiebreak innings to career totals while preserving that the player appeared in the match.
- Rates are rounded to two decimals. Only identifiers with at least one listed match are emitted.

## Matching results

- `public/players.json`: 4,282 rows; the matcher produced 1,024 distinct project slugs.
- Automatically matched: 623.
- Ambiguous: 30.
- Unmatched: 371.
- `src/data/cricsheet-review.json` holds the ambiguous candidates and unmatched names. No manual overrides were added. Matching requires a unique normalized full-name or register-name/alias match; initials-only ambiguity is not auto-accepted.
- The ten canonical duplicate slug pairs resolve to the same Cricsheet ID as their canonical page.

## Top 10 lists

Run totals:

| Player | Runs |
| --- | ---: |
| V Kohli | 9,336 |
| RG Sharma | 7,329 |
| S Dhawan | 6,769 |
| DA Warner | 6,565 |
| KL Rahul | 5,815 |
| SK Raina | 5,528 |
| MS Dhoni | 5,439 |
| AM Rahane | 5,367 |
| SV Samson | 5,181 |
| AB de Villiers | 5,162 |

Wicket totals:

| Player | Wickets |
| --- | ---: |
| YS Chahal | 233 |
| B Kumar | 226 |
| SP Narine | 207 |
| PP Chawla | 192 |
| JJ Bumrah | 187 |
| R Ashwin | 187 |
| DJ Bravo | 183 |
| RA Jadeja | 180 |
| Rashid Khan | 179 |
| A Mishra | 174 |

## Spot checks in generated HTML

The following built pages exist and include the batting table. Values below were checked against the rendered stats section:

| Player page | Matches | Runs | Innings | Average | Strike rate | Highest |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/players/aaron-finch/` | 92 | 2,091 | 90 | 25.19 | 128.20 | 88 |
| `/players/ab-de-villiers/` | 183 | 5,162 | 170 | 39.71 | 151.69 | 133 |
| `/players/ms-dhoni/` | 277 | 5,439 | 241 | 38.30 | 137.45 | 84 |
| `/players/suresh-raina/` | 204 | 5,528 | 200 | 32.52 | 136.73 | 100 |
| `/players/virat-kohli/` | 282 | 9,336 | 275 | 40.42 | 134.80 | 113 |

Bowling table display is gated at 60 legal balls. For example, Raina's page displays 25 wickets from 908 legal balls; Dhoni and de Villiers do not show a bowling table because they have no recorded legal bowling balls in this dataset.

## Commands run and results

- Inspected the three repository guidance files, Phase 1 report, player page source, slug helper, player data structure, canonical map, and ad setup before implementation.
- `npm run build:stats` — passed after downloading source files; processed 1,243 matches / 295,557 deliveries; generated 809 identifier records (520,068 bytes); no unresolved match registry names.
- `npm run build` — passed; 1,056 pages generated. The fresh output includes the new career sections on matched pages.
- `git status --short` and `git diff --stat` — confirmed only Phase 1/2 implementation and reports are changed; protected player data and game logic remain untouched. The unrelated untracked root file remains present.
- The first sandboxed source download was blocked by network access; it succeeded with the required elevated network access. Build output was written only to the generated `dist/` directory.

## Decisions made and why

- Used Cricsheet IDs from `info.registry.people` as stat keys to avoid conflating similarly named players.
- Kept uncertain matches out of public stats and wrote them to a review file. There are currently no manual overrides.
- The project's separate player records include no country field, so no country claim is generated.
- Kept stats generation out of the production build so Cloudflare builds do not need network access.
- Limited the prose variants to claims directly derived from page role/team/rating and matched match totals. The component remains static Astro HTML, with no client-side fetch or React island.
- Added an explicit source link and kept the Register's ODC-BY 1.0 notice separate from the match archive's attribution because the reviewed official pages did not specify the archive's license terms.

## Open questions / problems

- Review the 30 ambiguous and 371 unmatched cases in `src/data/cricsheet-review.json`; only add a manual override when identity is certain.
- Verify Cricsheet's current match-data license/attribution terms with the provider before expanding reuse beyond this factual stats display. The official pages reviewed explicitly describe the people Register's ODC-BY license but do not state a match archive license.
- Cricsheet's feed includes seasons through 2026 in this download. Confirm that the source snapshot is the intended data range before publishing it as current.
- Statistics are faithful to the parsed Cricsheet data and stated definitions; the report's top lists are sanity-check points, not an independent audit against a second data provider.

## Manual steps for the owner

1. Review `src/data/cricsheet-review.json` and add only verified IDs to `src/data/cricsheet-overrides.json`.
2. To refresh data, run `node scripts/match-players.mjs --refresh` followed by `node scripts/build-stats.mjs --refresh`; the package `build:stats` command runs both using the existing cache by default.
3. Verify Cricsheet's current license terms, then deploy the reviewed changes.

## Handoff notes for Phase 3

- Stats file shape: `{ data_version: { source, sourceUrl, downloadDate, generatedAt, matchesProcessed }, players: { [cricsheetId]: { matches, firstSeason, lastSeason, batting, bowling } } }`.
- Slug mapping is in `src/data/cricsheet-map.json`; verified manual overrides are separate in `src/data/cricsheet-overrides.json` and win at lookup time.
- `src/lib/playerStats.ts` exports `getPlayerStatsBySlug`, `getCricsheetPlayerIdBySlug`, `getPlayerStatsDataVersion`, and `formatOvers`.
- Matched player pages now include a static "Career in the IPL" section, source attribution, a batting table, and a bowling table where the player has at least 60 legal balls. Player pages without a trusted map match remain unchanged.
- The site uses Astro + React + Tailwind and `Layout.astro`; preserve the existing styling and keep ads disabled on game screens.
