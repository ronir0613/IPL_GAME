---
layout: ../../layouts/GuideLayout.astro
title: "DLS Labels and Rain Events in the Simulator"
description: "Understand the two rain events in the 16-0 Play match engine and the limits of its reduced-overs simulation."
slug: dls-rain-events
publishDate: "2026-09-29"
updatedDate: "2026-09-29"
readingTime: 7
toc:
  - { id: rain-has-two-paths, label: "Rain has two paths" }
  - { id: abandoned-match, label: "An abandoned match" }
  - { id: reduced-overs-event, label: "A reduced-overs event" }
  - { id: what-the-code-does-not-model, label: "What the code does not model" }
  - { id: standings-and-points, label: "Standings and points" }
  - { id: how-to-read-the-result, label: "How to read the result" }
  - { id: use-the-event-in-context, label: "Use the event in context" }
related:
  - { title: "How to play", href: "/guides/play-16-0-play/" }
  - { title: "Ratings and match strength", href: "/guides/ratings-star-stacking-chemistry/" }
  - { title: "Game modes", href: "/game-modes/" }
---

The 16-0 Play match engine has rain events that can change how a simulated fixture is presented. It can abandon a match with no result or mark a match as reduced overs and use a result labeled DLS. The code's reduced-over result is a game simulation, not a documented implementation of the official Duckworth–Lewis–Stern mathematical method. That distinction matters whenever you compare a simulated event with a real cricket scorecard.

This guide describes only what the current source code confirms. For the normal season flow and standings, start with [the beginner's guide](/guides/play-16-0-play/); for other simulation inputs, read [ratings and team calculations](/guides/ratings-star-stacking-chemistry/).

## <span id="rain-has-two-paths"></span>Rain has two paths

At the start of match simulation, the engine draws a random value. If the value is below 0.015 and the match is not a playoff, the result is an abandoned match. If the value is at least 0.015 but below 0.045, it records a reduced-overs rain event. If neither condition is met, that rain branch does not add an event. Based on the thresholds, the first band is 1.5 percent and the second is 3 percentage points of the random range.

These percentages describe the engine's threshold design, not an independently measured frequency in actual player sessions. Random seeds and the number of matches simulated will affect what an individual user sees. The comment in code calls the overall rain chance about three percent, but the two event bands together span 4.5 percent in the regular-season branch. The specific outcomes are separated: a 1.5-point band for abandonment and a 3-point band for reduced overs.

The abandonment check is explicitly skipped for playoff matches. The reduced-overs branch follows the first condition and does not add the same playoff exclusion. Thus the code permits a DLS-labeled reduced event in a playoff, while avoiding the abandoned no-result path there. Do not generalize the regular-season 1.5 percent abandonment threshold to playoff fixtures.

## <span id="abandoned-match"></span>An abandoned match

An abandoned match returns “No Result,” shows N/A for both scores, and includes a rain event with a description that says both teams receive one point. When the result is applied to league standings, both teams' played counts increase by one, each side receives one point, and net run rate is left unchanged. The match's win/loss totals and streak values are not updated by that branch.

This is different from a tie-break or a narrow win. There is no winner in the abandoned result, no score to compare, and no run margin. The result screen uses an abandoned marker in the app. In a season, the standings code treats it as a no-result point allocation. It should therefore not be described as a half-win or as a game whose result is decided by team strength.

The one-point value is verified in `applyResult`. If the match is not a league-table result, presentation can differ by mode; the core `simulateMatch` still returns the no-result shape described above when the abandonment condition applies. The key is to distinguish the match result object from a user's overall season record display.

## <span id="reduced-overs-event"></span>A reduced-overs event

For the reduced event, the engine records type `dls_reduced` and describes rain interruption with overs reduced and a result determined by DLS. Later, the match simulation marks the game as a DLS match and chooses a reduced-over count from 11 through 18. Without that event it uses twenty overs in this result-generation section. A generated score is drawn from ranges that differ between reduced and regular results.

The code does not calculate a target from balls remaining, wickets in hand, resources tables, or a first-innings score using a standard DLS algorithm. It creates a game event flag, chooses reduced overs, and then generates a simulated match result. The outcome code uses different score ranges for reduced matches and adds a DLS label to the winning margin. That is the scope supported by the source.

For example, the engine can produce a reduced match and show a margin such as “by X runs (DLS)” or “by Y wickets (DLS).” The label tells you which code path was used. It does not certify that the result equals an official DLS calculation. Use the phrase “DLS-labeled event in the simulator” when precision matters, and do not compare the generated number to a real match target as if it were the official method.

## <span id="what-the-code-does-not-model"></span>What the code does not model

The inspected rain branch does not represent a detailed weather forecast, a venue-specific rainfall history, or a complete real-world over-reduction procedure. The code uses a random draw and simple output ranges. It does not make a player-specific adjustment for rain, record a measured precipitation amount, or expose a resource table in the match result. Those absent details should not be filled in by an article.

The rain event is also not evidence that the simulator uses weather to alter every match. Most executions pass through the normal branch with no rain event. A player may encounter several events close together because random events can cluster, or none over a long run. The thresholds are not a schedule. No user action can select rain conditions in the logic read for this guide.

Likewise, rain should not be treated as proof that one lineup is better at handling weather. The engine does not expose a verified rain-resistance rating or condition-specific skill in this branch. Team strength and win probability are calculated in other sections. Keep those mechanics separate when explaining a surprising result.

## <span id="standings-and-points"></span>Standings and points

The season table logic awards two points for a win. For an abandoned rain no-result, both teams receive one point and net run rate is unchanged. The game does not count the no-result as either a win or a loss in that branch. This is why a record can include played matches without the same number being split among wins and losses.

The regular season fixture generator currently groups ten teams into two groups of five. The implementation creates double round-robin meetings inside each group and a cross-group set where one opponent is repeated. The resulting league schedule is fourteen games per team. Playoffs follow for the four highest-ranked teams using a Qualifier 1, Eliminator, Qualifier 2, and Final structure. This is why a rain event in a league match can affect points and standing, while the playoff branch follows its own progression.

Do not confuse the site's “16-0” challenge name with a verified sixteen-match league schedule. The fixture generator's counts are based on the code, not on the label used in game copy. For an overview of the modes and screens, visit [Game Modes](/game-modes/).

## <span id="how-to-read-the-result"></span>How to read the result

When you see a rain icon or DLS label, first check whether the match was abandoned or reduced. An abandoned match has N/A scores and “No Result.” A reduced event has a score and a result margin marked with the DLS suffix. The distinction affects how the league table is updated: the abandoned branch awards one point to each team and no NRR change; a completed reduced match follows the ordinary winner and points logic with its generated score and margin.

If a result surprises you, separate the event type from the cause of the winner. The rain flag controls reduced score ranges and presentation; it does not guarantee which side wins. The simulation still uses its match calculations and randomness. A higher rated side can lose. A rain event is one context detail, not a complete explanation by itself.

## <span id="use-the-event-in-context"></span>Use the event in context

Rain is best understood as a low-frequency simulator branch that changes whether a result is recorded and, in the reduced case, which score ranges and display label are used. It adds unpredictability to the season without reproducing every real-world weather or DLS rule. That description is less sweeping than calling it a full weather model, but it matches the implementation.

When you document a run, note the exact result the game produced rather than translating it into a real match rule that is not present in the code. The same discipline is useful for team strength: inspect the roster values and current [team-strength rules](/guides/ratings-star-stacking-chemistry/) rather than assuming that rain alone decided the result. If you are new to the interface, follow [the complete first-run guide](/guides/play-16-0-play/) before exploring simulated edge cases.
