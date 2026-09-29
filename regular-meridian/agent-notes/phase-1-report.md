# Phase 1 Report: Ads, Canonicals, and Secrets

## Summary

- Added the requested `ads.txt` line and a plain-text response header.
- Disabled the AdSense loader by default and removed direct loader tags from game modes and error pages.
- Added canonical handling for ten confirmed duplicate player slugs; the duplicate pages remain live.
- Excluded the duplicate slugs from the sitemap and confirmed the generated sitemap omits them.
- The production build completed successfully and generated 1,056 pages.
- `.dev.vars` is tracked and contains a Pusher secret variable; rotation is advisable because the file appears in Git history.

## Files created

- `src/lib/canonical.ts` — duplicate-slug map and `getCanonicalSlug` helper.
- `src/components/AdSlot.astro` — disabled placeholder intended for content pages only.
- `agent-notes/phase-1-report.md` — this report.

## Files modified

- `src/layouts/Layout.astro` — added `canonical` and default-false `showAds` props, site-wide self-canonical output, a conditional AdSense loader, and the Auto ads reminder.
- `src/pages/players/[slug].astro` — uses the canonical map while keeping duplicate pages live.
- `astro.config.mjs` — excludes duplicate player URLs from the sitemap.
- `src/pages/game-modes.astro`, `src/pages/404.astro`, `src/pages/500.astro` — removed direct AdSense loaders; their existing Google Analytics tags remain.
- `public/ads.txt` — ensured the required single line ends with one newline.
- `public/_headers` — added `Content-Type: text/plain; charset=utf-8` for `/ads.txt`.
- `.gitignore` — added `.dev.vars`; note that this file is already tracked, so this rule does not untrack it.

## Files intentionally NOT touched

- Protected game logic: `src/lib/engine.ts`, `multiplayer.ts`, `pusher.ts`, `gamble.ts`, `form.ts`, `profile.ts`, `App.tsx`, and `MpScreens.tsx`.
- Protected player data: `public/players.json`, `public/ipl_v10_FINAL.json`, `public/overseas_players.json`, `public/roles.json`, and `public/auction_*.json`.
- `.dev.vars` contents were not changed or printed. No secrets were rotated.
- The pre-existing untracked `D:\IPL_GAME\directory_graph.txt` was preserved.

## Commands run and results

- `git status --short --branch` — clean project checkout at start; one unrelated untracked root file (`directory_graph.txt`).
- `rg --files` — confirmed the Astro source, config, and policy files are under `regular-meridian/`.
- `npm run build` — passed; Astro generated 1,056 pages and sitemap files.
- Built output checks — `dist/ads.txt` matches the required line; the home page and game-modes page contain no AdSense loader; the Faf duplicate canonical points to `https://16-0play.com/players/faf-du-plessis/`; all ten mapped duplicate slugs are absent from the sitemap.
- `git diff --stat` — changes are limited to the Phase 1 implementation files; no protected data or game-logic files are modified. The new files are untracked and therefore are not included in `git diff --stat`.
- The first sandboxed build attempt could not create Astro's telemetry config directory under the user profile. The same requested build succeeded with the required filesystem access.

## Ad audit findings

Search terms: `adsbygoogle`, `googlesyndication`, `pagead2`, `ca-pub`, `data-ad-client`, `data-ad-slot`, `google-adsense-account`, `gtag`, and `googletagmanager`.

- `src/layouts/Layout.astro`: Google Analytics hits on lines 29–36; the conditional AdSense loader is on line 103. No `google-adsense-account` meta tag exists.
- `src/pages/game-modes.astro`: Google Analytics hits on lines 29–36. The direct AdSense loader was removed.
- `src/pages/404.astro`: Google Analytics hits on lines 27–34. The direct AdSense loader was removed.
- `src/pages/500.astro`: Google Analytics hits on lines 33–40. The direct AdSense loader was removed.
- No other matches were found in `src/` or `public/` after the changes. The conditional loader remains inactive because `showAds` defaults to `false` and no page opts in.

## Final canonical map

```ts
export const canonicalSlugs: Record<string, string> = {
  'faf-du-plessis-vc': 'faf-du-plessis',
  'rashid-khan-vc': 'rashid-khan',
  'lokesh-rahul': 'kl-rahul',
  'muthiah-muralidaran': 'muttiah-muralitharan',
  'm-shahrukh-khan': 'shahrukh-khan',
  'dhaval-kulkarni': 'dhawal-kulkarni',
  'steven-smith': 'steve-smith',
  'sourav-ganguly-vc': 'sourav-ganguly',
  'rinku-singh-vc': 'rinku-singh',
  'venkatesh-iyer-vc': 'venkatesh-iyer',
};
```

All ten pairs exist in `public/ipl_v10_FINAL.json`, which drives the static player pages. The entries with `(vc)` share the base player's name after removing that suffix and have the same role, while their records carry different season/team/rating values. The data has no separate card identifier, so the canonical map consolidates the person pages while each page still renders its own grouped history.

`r-ashwin -> ravichandran-ashwin` was omitted: the target exists, but no `r-ashwin` route is generated from the player data.

## Candidate duplicates found but not added

These are spelling or name-similarity candidates from the distinct names in `public/players.json`; they were not added because the data alone does not establish identity:

- `kuldeep-yadav` / `kuldip-yadav` — spelling variation; verify before merging.
- `zaheer-khan` / `zahir-khan` — spelling variation; verify before merging.
- `karn-sharma` / `karan-sharma` — similar names but potentially different people; verify before merging.

The automated similarity scan also found many unrelated names with small edit distances. Those were not treated as duplicates.

## Secrets check findings (names only)

- `regular-meridian/.dev.vars` is tracked and appears in Git history. Its variable names are `PUSHER_APP_ID`, `PUSHER_APP_KEY`, `PUSHER_APP_SECRET`, and `PUSHER_APP_CLUSTER`; no values were printed.
- `src/lib/pusher.ts` references `PUBLIC_PUSHER_APP_KEY`, `PUBLIC_PUSHER_HOST`, and `PUBLIC_PUSHER_CLUSTER`. No hard-coded secret value was found in `wrangler.toml` or `src/`.
- `.gitignore` covers `.env`, `.env.production`, `.dev.vars`, `.wrangler/`, `dist/`, and `node_modules/`. Because `.dev.vars` is already tracked, the new ignore rule does not remove it from the index.
- Rotation is advisable for the Pusher secret because `.dev.vars` is present in repository history. Nothing was rotated. The owner should remove the file from tracking and rotate the secret through the Pusher dashboard.

## Decisions I made and why

- Kept ten validated duplicate pairs and excluded `r-ashwin`, because that slug has no generated page in the route source.
- Removed direct AdSense loaders from the game-modes and error pages so the only loader in source is gated by `showAds=false`.
- Left `robots.txt` unchanged: `User-agent: *` and `Allow: /` permit the AdSense crawler and `/ads.txt`, and the file points to the sitemap index.
- Left `_redirects` unchanged: it contains no `/ads.txt` redirect or rewrite.
- Did not add the `google-adsense-account` meta tag because none was present.

## Open questions / problems

- Please review the three unadded spelling candidates before deciding whether to consolidate their pages.
- `.dev.vars` remains tracked in the current Git index; the ignore entry alone cannot stop updates to a tracked file. The local file was preserved as required for secret safety, but it should be untracked and its secret rotated by the owner.

## Manual steps for the owner

1. Keep Auto ads off or exclude the game pages in the AdSense dashboard.
2. Remove `regular-meridian/.dev.vars` from Git tracking, keep the local file private, and rotate the Pusher secret.
3. Deploy the changes.
4. Verify `https://16-0play.com/ads.txt` returns the required line with a plain-text content type.

## Handoff notes for Phase 2

- Dynamic player pages are generated in `src/pages/players/[slug].astro` from `public/ipl_v10_FINAL.json`, grouped using `src/lib/slugify.ts`. The records used for those pages have `name`, `team`, `season`, `role`, and `rating` fields.
- `public/players.json` is a separate 4,282-row array with numeric `id`, `name`, `team`, `season`, `overall`, `role`, and boolean `is_overseas` fields. Phase 2 should preserve both data files and match using stable Cricsheet IDs rather than altering player names or slugs.
- `src/lib/canonical.ts` exports `canonicalSlugs` and `getCanonicalSlug(slug)`. The sitemap filter has the same ten duplicate slugs.
- `.cache/cricsheet/`, stats scripts, and generated career stats have not been created yet.
