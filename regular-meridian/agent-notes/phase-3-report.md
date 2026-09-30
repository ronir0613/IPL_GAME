# Phase 3 Report: Original Guides and Site Trust Content

## Summary

- Added eight long-form cricket strategy guides, a guide directory, and a shared article layout with breadcrumbs, table of contents, author/publisher data, dates, reading time, related links, and Article JSON-LD.
- Expanded the About, Rating System, and Game Modes pages with original, code-checked explanations and links into the guides.
- Added guide discovery from the home page and navigation, and ensured every generated HTML page has the required guides, game modes, rating, and legal/contact destinations in its footer.
- Updated privacy disclosures to describe the current analytics, local storage, and multiplayer data flows, and to explain the AdSense behavior if it is enabled later.
- Kept AdSense inactive by default. The production build contains no AdSense loader and generated 1,065 pages successfully.
- No deployment, AdSense dashboard changes, commits, pushes, or edits to protected game logic/player data were made.

## Guide catalog and length

The following counts are approximate plain-text body word counts, excluding frontmatter and HTML tags. Each guide clears the requested 900-word minimum.

| Guide | Approx. words |
| --- | ---: |
| How to Play 16-0 Play | 1,419 |
| Ratings, Star Stacking, and Chemistry | 1,311 |
| How to Build a Balanced Playing XI | 1,714 |
| Signature Pairs and Team Chemistry | 1,236 |
| Multiplayer Draft and Auction Strategy | 1,216 |
| Rain, Reduced Overs, and Match Results | 1,086 |
| Overseas Players and Squad Balance | 1,312 |
| Eight Draft Mistakes and How to Avoid Them | 1,048 |

## Files created

- `src/layouts/GuideLayout.astro` — article metadata, breadcrumb, TOC, reading time, related links, CTA, and Article JSON-LD.
- `src/pages/guides/index.astro` — guide index with descriptions and links.
- Eight Markdown pages under `src/pages/guides/` — the articles listed above.
- `agent-notes/phase-3-report.md` — this report.

## Files modified

- `src/components/AboutContent.astro` — added substantive site/game/source information and internal links.
- `src/components/Explore.tsx` — corrected claims that did not match the game implementation.
- `src/components/ContactContent.astro` — exposed the existing public contact email.
- `src/components/NavBar.tsx`, `src/layouts/Layout.astro`, `src/pages/index.astro` — added guide/game-mode navigation and internal entry points; expanded site footer and affiliation disclaimer.
- `src/pages/game-modes.astro`, `src/pages/rating-system.astro` — added detailed, code-checked explanations.
- `src/pages/privacy-policy.astro` — documented current data handling and the conditional future ad technology disclosures.
- `src/pages/about.astro`, `about-us.astro`, `contact.astro`, `contact-us.astro`, `terms-and-conditions.astro` — aligned page metadata/canonicals with the shared layout.
- `src/pages/players/[slug].astro` — links relevant player profiles to the applicable guide content and retains the Phase 2 career statistics display.
- `src/pages/404.astro`, `src/pages/500.astro` — added useful site and legal navigation to error pages.
- `src/layouts/Layout.astro` — normalized the Game Modes footer link to `/game-modes`.

## Editorial accuracy checks and implementation notes

The guide copy was checked against the current source implementation. Key verified details include:

- A normal solo lineup uses 11 players and a maximum of four overseas players. Franchise and multiplayer have separate roster settings.
- The game uses role weights, rating diminishing returns, overseas penalties, signature-pair chemistry, rivalry penalties, and team/role identity bonuses in its squad strength calculation.
- The solo season code generates 14 league matches per team (70 total), followed by a four-team playoff. The title's “16-0” is not the number of league fixtures. This corrects a mismatch in the supplied workflow's “16 matches” wording.
- Multiplayer human picks use a timed auction/bidding flow. AI roster fill uses a snake-order routine. The guide describes these as separate mechanics rather than calling the human draft a snake draft.
- The rain mechanic is a simplified simulation and not the official Duckworth–Lewis–Stern method. The guides do not present it as an official calculation.
- “Gamble” generates a random-philosophy team; it is not wagering. Franchise and multiplayer descriptions avoid unverified promises about contracts and disconnect replacement.
- Player records lack a country field; the site therefore does not invent nationality claims.

## Verification

- `npm run build` — passed after the final footer edits; Astro generated 1,065 pages and the sitemap.
- Generated-page footer audit — passed on all 1,065 HTML pages for the guide, game modes, rating system, about, contact, privacy, and terms links (accepting the slash/no-slash route form).
- All eight guide pages were checked for one H1, one canonical URL, Article JSON-LD, metadata lengths, and presence in the sitemap; no SEO check failures were found.
- Guide internal links were checked against generated routes; no broken guide links were found.
- Rendered guide directory was inspected in the local preview. Better Design comprehension review reported zero critical issues, three serious findings, and one minor finding. The serious count/action estimate is driven partly by the full eight-guide index requested in the brief; “XI” was clarified in article copy and “combos” was replaced with “team chemistry.”
- The Better Design MCP free query quota was exhausted before the follow-up comprehension and measured spacing checks could run (tool returned HTTP 402 `AGENT_QUOTA_EXHAUSTED`). Therefore no measured DOM spacing result is claimed.
- Built output was checked for AdSense loader references; none were present. `showAds` remains false by default and no page opts in.
- `public/ads.txt` contains the required publisher line. This verifies the build artifact only, not the live domain response.
- `D:\IPL_GAME\directory_graph.txt` was preserved as an unrelated, pre-existing untracked file.

## Source-based policy notes

- The privacy page reflects the code found in this checkout: Google Analytics via gtag, local-storage preferences/profile data, Pusher presence/channel activity, and no PeerJS package in the inspected dependencies. It explains AdSense cookies/partners conditionally because the site has not enabled the AdSense loader.
- The page links to Google's current AdSense cookie and privacy-policy guidance: [AdSense cookie guidance](https://support.google.com/adsense/answer/7549925?hl=en) and [AdSense privacy-policy requirements](https://support.google.com/adsense/answer/1348695?hl=en).
- This content should be reviewed by the site owner against the services and settings actually enabled in production.

## Open owner decisions and remaining manual work

1. The About page does not identify a named creator or editorial author. Add the owner's preferred public name/organization and a short editorial review policy if desired; no identity was inferred.
2. Cricsheet's Register identifies ODC-BY 1.0 for the people register, but its reviewed official pages did not clarify the ball-by-ball archive license. Confirm archive reuse/attribution terms with Cricsheet before expanding this use. See the Phase 2 report.
3. Review the 30 ambiguous and 371 unmatched player-name cases in `src/data/cricsheet-review.json`; the build-time career stats intentionally omit uncertain matches.
4. `.dev.vars` is tracked and appears in repository history. Its contents were not changed or printed. The owner should remove it from Git tracking and rotate the Pusher secret through the provider dashboard.
5. Deploy, then verify `https://16-0play.com/ads.txt` returns the exact publisher line with a plain-text content type. Keep Auto ads disabled on game/error screens.
6. After deployment, inspect the actual live pages, sitemap, consent/privacy configuration, and AdSense policy center before requesting another review. Approval cannot be guaranteed by source changes alone.

## Protected and external actions

The following files were not modified: `src/lib/engine.ts`, `multiplayer.ts`, `pusher.ts`, `gamble.ts`, `form.ts`, `profile.ts`, `App.tsx`, `MpScreens.tsx`, `public/players.json`, `public/ipl_v10_FINAL.json`, `public/overseas_players.json`, `public/roles.json`, and `public/auction_*.json`. No secrets were printed or rotated, no AdSense dashboard was accessed, and no messages were sent externally.
