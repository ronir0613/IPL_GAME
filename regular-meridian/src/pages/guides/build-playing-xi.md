---
layout: ../../layouts/GuideLayout.astro
title: "How to Build a Playing XI"
description: "A practical approach to roles, batting and bowling depth, overseas places, and the team-strength breakdown in 16-0 Play."
slug: build-playing-xi
publishDate: "2026-09-29"
updatedDate: "2026-09-29"
readingTime: 7
toc:
  - { id: begin-with-a-role-map, label: "Begin with a role map" }
  - { id: cover-the-batting-order, label: "Cover the batting order" }
  - { id: plan-bowling-options, label: "Plan bowling options" }
  - { id: spend-overseas-places-with-purpose, label: "Spend overseas places with purpose" }
  - { id: choose-the-core, label: "Choose the core" }
  - { id: inspect-the-calculated-strength, label: "Inspect calculated strength" }
  - { id: example-selection-process, label: "An example selection process" }
  - { id: final-xi-check, label: "Final XI check" }
related:
  - { title: "Ratings and chemistry", href: "/guides/ratings-star-stacking-chemistry/" }
  - { title: "Overseas players", href: "/guides/overseas-players/" }
  - { title: "Browse player profiles", href: "/players/" }
---

Building a strong playing XI in 16-0 Play means choosing eleven players whose ratings and roles work together under the game's calculation. There is no single lineup that is strongest in every run: the player pool, team data, and match events change the context, and the simulator has random variance. A sound method is repeatable, though. Start with coverage, fill role gaps, then inspect the team-strength breakdown before making final swaps.

This guide covers the standard eleven-player calculation. Some modes include reserves or additional settings, so use the roster count shown in that mode. The basic XI rule still gives you a clear framework for choosing. For exact rating arithmetic, keep [the ratings and chemistry reference](/guides/ratings-star-stacking-chemistry/) open while you compare candidates.

## <span id="begin-with-a-role-map"></span>Begin with a role map

Before picking names, divide the lineup into jobs. You need players who contribute to batting, players who contribute to bowling, and preferably some who do both. The engine classifies players as `BAT`, `WK`, `BAT_AR`, `AR`, `BOWL_AR`, or `BOWL`. Batters and wicketkeepers receive full batting weight; pure bowlers receive full bowling weight. All-rounder variants bridge both calculations at different weights.

Write a simple role map, such as “wicketkeeper, top-order batting, middle-order support, finishing options, bowling options.” This is not a hidden tactical formation imposed by the game; it is a planning aid so you do not accidentally spend every pick in one category. The interface displays roles and ratings to help you inspect the roster. The match-strength calculation considers role fields rather than your chosen batting order.

The game's bonus thresholds reward certain role counts, including at least seven `BAT`/`WK` players, at least five pure `BOWL` players, or at least four players in the all-rounder role group. Treat these as optional identity bonuses, not required minimums or a complete guide to cricket tactics. A lineup with four all-rounders may activate an identity, but it still needs useful batting and bowling contributions in the weighted calculations.

## <span id="cover-the-batting-order"></span>Cover the batting order

Batting depth is more than collecting the highest batting ratings. Think about the roles you want represented across the eleven and how many players contribute to the batting average. A pure batter has no bowling weight in the formula. That can make the batting average look attractive while leaving the bowling side dependent on a small subset of players. Conversely, choosing only dual-role players may make the nominal role count feel balanced but can lower a specialty average if their relevant weights are smaller.

Wicketkeepers count as batters for strength calculation and also activate the role identity count used by the engine. The code does not check for an opening pair, left-right combination, or a particular batting order when calculating overall strength. Those may be common cricket ideas, but don't describe them as automated game bonuses unless the screen or code implements them.

When comparing two candidates, ask what role each provides and which existing player they would replace. A 90-rated pure batter replacing an 83-rated all-rounder changes the batting and bowling denominators differently from adding a 90-rated player to the reserves. The first eleven filled slots determine strength; reserve players outside that group do not add to the overall calculation. So a strong bench cannot fix an unbalanced first XI in the rating formula unless the match preparation feature puts a reserve into the selected playing XI.

## <span id="plan-bowling-options"></span>Plan bowling options

The bowling strength is the weighted average of players with bowling-role weight. Pure bowlers and `BOWL_AR` contribute fully, `AR` contributes three quarters, and `BAT_AR` contributes one quarter. A pure batter or wicketkeeper contributes no bowling weight. These weights are why role composition changes the figures even when two sides have similar raw averages.

Aim to understand how many players actually affect the bowling calculation and what kind of bowling role they represent. The source roles do not label pace and spin as weights in this formula. The roster data may describe additional style, but the team strength function itself uses role and overall. Claims such as “five bowlers are enough for four overs each” do not follow from this team-strength logic and should not be confused with a verified rule.

Check the bowling total after making changes. If it is substantially lower than batting, consider whether an all-rounder or bowling role could fill a gap without creating a new weakness. The simulation can still produce a win with a lower bowling number, and there may be match-preparation mechanics in a particular mode. A strength score is one input, not a guarantee of a scorecard.

## <span id="spend-overseas-places-with-purpose"></span>Spend overseas places with purpose

The standard playing XI allows no more than four overseas players. A fifth is ineligible in the standard lineup. The team-strength function also subtracts a progressive penalty: one point for exactly two overseas players, two for exactly three, and three for four or more. One or zero overseas players has no overseas quality penalty. This is separate from the role weights and from the hard lineup cap.

The limit means an overseas place has an opportunity cost. Use it where a player fills a role, supports a balance need, or completes a chemistry pair that genuinely fits the rest of the XI. Do not assume the highest-rated overseas player is the best selection if the side already has four. Similarly, avoid describing the penalty as a judgment on overseas players; the code applies it to the count, irrespective of nationality or individual rating.

Some multiplayer lobby settings have a distinct overseas limit control for auction rosters. That setting can differ from the standard single-player XI limit, while the match center applies the host's setting to the multiplayer XI. Always read the current mode's control and lineup validation. The dedicated [overseas player guide](/guides/overseas-players/) compares the standard selection limit with this quality penalty.

## <span id="choose-the-core"></span>Choose the core

The engine checks twelve signature pairs. A complete pair can add one point, up to five total chemistry points. It also checks four rivalry pairs, subtracting one each up to a total of three. Additionally, a core of three players from one historical team can add one identity point, and a core of five or more from that team adds two. These mechanics reward some familiar combinations, but they do not require you to build a whole eleven from one team.

The names are checked against the selected player names in lowercase. That means spelling and the exact roster record can matter. A similarly named player is not necessarily a match for a hard-coded pair. A pair bonus is a property of the current game's fixed list, not a general claim that the two players were teammates in every season or had a special off-field relationship. See the full [signature-pair list](/guides/signature-pairs/).

If you choose a same-team core, watch the trade-off with overseas and role balance. You can have a cohesive set of names but a thin bowling group, or a strong role mix without any chemistry pair. The identity bonus can be combined with chemistry, though its own combined team-identity total is capped at five. Use bonuses to refine a functional XI; do not let a bonus become the only reason a player occupies a needed slot.

## <span id="inspect-the-calculated-strength"></span>Inspect calculated strength

Once you have eleven players, read the breakdown in a consistent order. Start with the raw average to understand the baseline. Then check the displayed average stacking impact, overseas penalty, chemistry, rivalry, and identity values. Finally, note whether the overall exceeds 90 before diminishing returns are applied. This sequence helps you see why a high raw average may become a smaller final overall.

The star-stacking calculation sorts the selected players by overall. After the first two players at 92 or higher, every additional such player has two points subtracted from their effective contribution. After the first player at 95 or higher, additional 95-plus players have three more points subtracted; because they are also 92-plus, some players can receive both deductions. The breakdown reports the average impact across filled players rather than listing every affected player.

If overall strength is above 90 after other adjustments, the engine reduces half of the excess. A pre-diminishing value of 94 loses two points, not four. After this step, overall is rounded. The batting and bowling figures also receive an adjustment based on final overall versus raw average. Read those display values as related indicators, not as independent guarantees.

## <span id="example-selection-process"></span>An example selection process

Suppose your first selections are a wicketkeeper, four specialist batters, two pure bowlers, and two all-rounders. That is nine players; you still have two slots. Instead of picking two more batters automatically, look at the bowling weights and how many overs or wicket-taking options the roster should represent. Add one player who strengthens a weak specialty, then use the final slot to complete a role or a verified pair if the team still needs one.

Before locking the XI, count the overseas players. If you have three, your strength calculation includes a two-point overseas penalty. Replacing one with a domestic all-rounder might reduce the count penalty and add a bit of bowling weight, while replacing a specialist batter could lower batting strength. Compare the resulting breakdown rather than assuming either swap is always right.

Then check stacking and identity. If your roster has a third player at 92+, note the two-point deduction on that player's effective rating. If four players are all-rounders, the corresponding identity threshold may activate. If you have a listed chemistry pair, check whether the bonus appears. This is a concrete, traceable process: each change should have an explanation in the code-backed fields.

## <span id="final-xi-check"></span>Final XI check

Use this concise checklist: eleven players in the standard XI; a wicketkeeper if that is part of your chosen plan; enough batting and bowling roles to make both weighted averages meaningful; four or fewer overseas players; a deliberate view of star stacking; and a review of chemistry, rivalries, identity, and diminishing returns. Check the final team after any move rather than relying on an earlier calculation.

For a first run, follow [the beginner's guide](/guides/play-16-0-play/), then review [ten common draft mistakes](/guides/draft-mistakes/) for last-minute traps. You can browse [player profiles](/players/) to inspect database roles and source-backed statistics when available. The best XI for one challenge is the side whose trade-offs you understand; the number on the screen is only part of that explanation.
