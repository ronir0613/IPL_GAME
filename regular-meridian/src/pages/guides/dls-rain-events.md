---
layout: ../../layouts/GuideLayout.astro
title: "DLS Labels and Rain Events in the Simulator"
description: "Understand rain events in 16-0 Play, how reduced overs affect a match, and why its DLS label is simplified."
slug: dls-rain-events
publishDate: "2026-09-29"
updatedDate: "2026-09-29"
readingTime: 7
toc:
  - { id: rain-has-two-paths, label: "Rain has two paths" }
  - { id: abandoned-match, label: "An abandoned match" }
  - { id: reduced-overs-event, label: "A reduced-overs event" }
  - { id: what-the-game-does-not-model, label: "What the game does not model" }
  - { id: standings-and-points, label: "Standings and points" }
  - { id: how-to-read-the-result, label: "How to read the result" }
  - { id: use-the-event-in-context, label: "Use the event in context" }
related:
  - { title: "How to play", href: "/guides/play-16-0-play/" }
  - { title: "Ratings and match strength", href: "/guides/ratings-star-stacking-chemistry/" }
  - { title: "Game modes", href: "/game-modes/" }
---

Rain can affect how a simulated 16-0 Play match ends. The game can abandon a match with no result or reduce the overs and label the result DLS. This is a simplified game simulation, not the official Duckworth–Lewis–Stern (DLS) method used in professional cricket. Keep that difference in mind when comparing a game result with a real scorecard.

This guide explains what you may see during a season. For the season flow and standings, start with [the beginner's guide](/guides/play-16-0-play/); for other factors that affect your team, read [ratings and team calculations](/guides/ratings-star-stacking-chemistry/).

## <span id="rain-has-two-paths"></span>Rain has two paths

At the start of a match, the game makes a random check for rain. In a regular-season match, there is a 1.5 percent chance of an abandonment and a separate 3 percent chance of reduced overs. If neither happens, the match proceeds normally. These are the game's chances, not a prediction of how often rain should occur in real cricket.

The two rain outcomes are separate, so their chances add up to 4.5 percent for a regular-season match. You may see several close together or go a long time without one; the random check does not follow a schedule.

Playoff matches are not abandoned by this rain rule. A playoff can still have reduced overs and show the DLS label. The regular-season abandonment chance does not apply to the playoffs.

## <span id="abandoned-match"></span>An abandoned match

An abandoned match returns “No Result,” shows N/A for both scores, and includes a rain event with a description that says both teams receive one point. When the result is applied to league standings, both teams' played counts increase by one, each side receives one point, and net run rate is left unchanged. The match's win/loss totals and streak values are not updated by that branch.

An abandoned match is different from a tie or a narrow win: there is no winner, score, or run margin. The result is shown as “No Result.” Each team receives one point, and net run rate does not change. The match is not counted as either a win or a loss.

The one-point value is verified in `applyResult`. If the match is not a league-table result, presentation can differ by mode; the core `simulateMatch` still returns the no-result shape described above when the abandonment condition applies. The key is to distinguish the match result object from a user's overall season record display.

## <span id="reduced-overs-event"></span>A reduced-overs event

For a reduced-overs match, the game chooses between 11 and 18 overs instead of the usual 20. It then generates scores using ranges suited to the shorter match. The score and winner are part of the game's own simulation.

The game does not calculate a revised target from balls remaining, wickets in hand, resource tables, or the first-innings score using the official DLS method. Instead, it creates a reduced-overs match, generates a result using its own score ranges, and adds a DLS label to the margin. That label describes the game's rain event; it does not confirm an official DLS calculation.

For example, a result may read “by runs (DLS)” or “by wickets (DLS).” The label tells you that the game used its reduced-overs event. It does not mean the score was worked out with official DLS rules. Do not compare its target or margin with a real match as if the calculations were the same.

## <span id="what-the-game-does-not-model"></span>What the game does not model

Rain in the game is not a detailed weather forecast or a venue-specific rainfall history. It does not measure rainfall, adjust individual players for weather, or show a DLS resource table. The event is a simple way to vary the match and its result.

Most matches have no rain event. You may encounter several in a short stretch or none over a long season. Rain is not a condition you can choose before the match.

Rain does not reveal that one lineup is better in wet conditions. Players do not have a rain-resistance rating in the game. Team strength and the match result are separate from the rain event.

## <span id="standings-and-points"></span>Standings and points

In the league table, a win is worth two points. An abandoned match gives both teams one point, leaves net run rate unchanged, and counts as neither a win nor a loss. That is why the number of matches played may not equal a team's total wins and losses.

The season has ten teams in two groups of five. Each team plays its group opponents twice and the other group once, with one opponent repeated, for fourteen league matches. The top four go to the Qualifier 1, Eliminator, Qualifier 2, and Final. A rain abandonment affects league points as described above; playoff matches follow their own progression.

The “16-0” challenge name does not mean that the league has sixteen matches per team. There are fourteen league matches, followed by playoffs for the top four. For an overview of each mode, visit [Game Modes](/game-modes/).

## <span id="how-to-read-the-result"></span>How to read the result

When you see a rain icon or DLS label, check whether the match was abandoned or reduced. An abandoned match has no score and shows “No Result.” A reduced match has a score and a DLS label on the margin. Abandonment gives each team one point without changing net run rate; a completed reduced match awards points to its winner as usual.

If a result surprises you, separate the event type from the cause of the winner. The rain flag controls reduced score ranges and presentation; it does not guarantee which side wins. The simulation still uses its match calculations and randomness. A higher rated side can lose. A rain event is one context detail, not a complete explanation by itself.

## <span id="use-the-event-in-context"></span>Use the event in context

Think of rain as an occasional game event that can interrupt a match or shorten it. It adds variety to a season, but it does not reproduce every real-world weather condition or DLS rule.

When you describe a run, use the result shown in the game rather than treating it as an official real-world DLS result. The same care helps when considering team strength: read the [team-rating guide](/guides/ratings-star-stacking-chemistry/) instead of assuming rain alone decided the match. If you are new, follow [the complete first-run guide](/guides/play-16-0-play/).
