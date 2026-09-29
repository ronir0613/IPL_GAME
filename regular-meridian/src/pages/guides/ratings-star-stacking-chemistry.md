---
layout: ../../layouts/GuideLayout.astro
title: "Ratings, Star Stacking, and Team Chemistry"
description: "See how 16-0 Play turns player ratings, role weights, chemistry, rivalries, and roster balance into team strength."
slug: ratings-star-stacking-chemistry
publishDate: "2026-09-29"
updatedDate: "2026-09-29"
readingTime: 7
toc:
  - { id: what-a-player-rating-means, label: "What a player rating means" }
  - { id: role-weights-and-team-averages, label: "Role weights and team averages" }
  - { id: star-stacking-rules, label: "Star-stacking rules" }
  - { id: chemistry-and-rivalries, label: "Chemistry and rivalries" }
  - { id: identity-and-franchise-bonuses, label: "Identity and franchise bonuses" }
  - { id: diminishing-returns, label: "Diminishing returns" }
  - { id: use-the-breakdown, label: "Use the breakdown" }
related:
  - { title: "Signature pairs", href: "/guides/signature-pairs/" }
  - { title: "Build a playing XI", href: "/guides/build-playing-xi/" }
  - { title: "Rating system", href: "/rating-system/" }
---

Player ratings in 16-0 Play are inputs to a game calculation. They do not by themselves predict a match, and they are not presented as official rankings of real cricketers. The selected eleven are assessed together. Role coverage changes batting and bowling averages; roster choices can add bonuses or deductions; random outcomes still affect a match. Understanding those layers is more useful than trying to maximize every individual number.

The exact rules below describe the current code in `src/lib/engine.ts`. Some existing page copy uses broader phrases such as “team-wide penalty”; this guide spells out what the calculation actually does so you can interpret the strength breakdown accurately. For the step-by-step selection version, see [how to build a playing XI](/guides/build-playing-xi/).

## <span id="what-a-player-rating-means"></span>What a player rating means

Each player record carries an overall number and a role. The game uses the overall value in several calculations. The database's rating is not recomputed from the Cricsheet career table: career runs and wickets are separate source data. For instance, a Cricsheet profile can tell you how many runs were recorded for a matched player, while the in-game rating remains the number stored for that player in the game data.

This distinction matters when discussing examples. Calling a player “high-rated” means the game's own rating input is high. It does not mean the site has independently proven that player is objectively better than another cricketer. The ratings page describes the data as internally balanced approximations, and that is the right frame for strategy discussions. Browse the [player database](/players/) for the game's displayed profile values and use the [Cricsheet career section](/guides/play-16-0-play/) only where a matched source record exists.

## <span id="role-weights-and-team-averages"></span>Role weights and team averages

Strength uses the first eleven filled squad slots. For batting, `BAT` and `WK` count at full weight, `BAT_AR` at full weight, `AR` at 0.75, and `BOWL_AR` at 0.25. Pure `BOWL` contributes no batting weight. For bowling, pure `BOWL` and `BOWL_AR` count at full weight, `AR` at 0.75, `BAT_AR` at 0.25, and pure `BAT` or `WK` contribute no bowling weight. Each specialty score is the weighted rating total divided by the sum of the applicable weights.

The engine also computes a raw average of the ratings for the filled players and an effective average after stacking penalties. Bonuses and penalties are then added or subtracted to make a team overall. Finally, the difference between that overall and the raw average is applied as an adjustment to the role-weighted batting and bowling values. The displayed batting and bowling figures therefore are related to overall team adjustments; they are not independent match forecasts.

This is why role depth has value. Imagine adding one more batter when the XI already has several, versus replacing a pure batter with an all-rounder who contributes to bowling as well. The second choice can change the denominator and weighted total for both specialty calculations. The all-rounder does not automatically make the side superior; the result depends on the rest of the eleven and the exact weights. The useful question is whether the roster has enough options in both disciplines for the simulation's team calculation.

## <span id="star-stacking-rules"></span>Star-stacking rules

The code sorts selected players by rating from highest to lowest, then applies individual deductions. For ratings of at least 92, the first two avoid the 92-plus deduction; each additional 92-plus player loses two effective rating points. For ratings of at least 95, the first player avoids the 95-plus deduction; each additional 95-plus player loses three more points. Because a 95-plus player also qualifies for the 92-plus group, a later 95-plus selection can incur both deductions.

These are not simply one fixed subtraction from the finished team score. The engine subtracts the deductions from affected player ratings before it averages the selected players. The `stackingPenalty` value shown in the breakdown is that total deduction divided by the number of filled players. So if two players each lose points, the displayed average impact is smaller than the raw deductions combined. This is a precise distinction from wording that says the code takes a flat amount off the whole team.

As a planning example, a roster with two 92-plus players does not incur a stacking deduction from the 92 threshold. A third player at 92 or above incurs two points against that player's effective contribution. If two or more players are 95-plus, every one after the first also incurs the additional three-point threshold deduction; any player after the second who is in both groups takes both. The engine applies the rule to the first eleven in squad order after filtering filled slots, then sorts that group to assign deductions. Reserve players outside those first eleven do not affect the strength calculation.

## <span id="chemistry-and-rivalries"></span>Chemistry and rivalries

The chemistry list is a fixed set of name pairs in the engine. If both exact normalized names are present in the selected XI, that pair adds one point. The calculation caps the combined chemistry bonus at five, even if more qualifying pairs are present. The code uses a `Set` of lowercased names; it does not use the player ID or the season field to establish pair eligibility.

There is also a rivalry list. Each complete rival pair subtracts one point, and the combined rivalry penalty is capped at three. The bonus and penalty lists are independent, so a XI can contain both a chemistry pair and one or more rival pairs. This is a simplified game rule, not a statement about real relationships between the named players. It is best described as “the game recognizes this combination,” not as a factual claim about whether players get along.

The complete pair lists appear in [the signature-pairs guide](/guides/signature-pairs/). Two examples found in the current code are Virat Kohli with AB de Villiers for a bonus, and Virat Kohli with Gautam Gambhir for a rivalry deduction. Another bonus pair is MS Dhoni with Suresh Raina. If a name spelling in the game data differs from the string in the pair list, the match may not be found; exact game names matter.

## <span id="identity-and-franchise-bonuses"></span>Identity and franchise bonuses

Three role-based identities can add one point apiece. “Batting-Heavy” activates with at least seven players whose role is exactly `BAT` or `WK`. “Bowling-Heavy” activates with at least five whose role is exactly `BOWL`. “All-Rounder Army” activates with at least four `AR`, `BAT_AR`, or `BOWL_AR` roles. A player is counted under the category matching the code condition; the identities are not a general assessment of whether a team feels balanced.

The engine also counts original-team values. A core of three players from one team contributes one point; a core of five or more from that team contributes two. If separate teams each reach a threshold, the loop can award for each franchise core, then the combined team identity bonus is capped at five. A larger core does not get both the three-player and five-player award for the same franchise; it gets the two-point tier.

Role identities and franchise cores stack with signature chemistry. Therefore, the displayed `teamIdentityBonus` can include more than one reason, while `chemistryBonus` is kept in its own field. The identity labels in the returned breakdown tell you which role identity or franchise core was found. This gives you a way to reason about a roster: one familiar pair may be worth one chemistry point, while a same-team core can earn a separate identity contribution.

## <span id="diminishing-returns"></span>Diminishing returns

After the effective average and bonuses are combined, an overall value above 90 is reduced by half of the amount above 90. For example, if the pre-diminishing calculation is 94, the engine subtracts two points, leaving 92 before final rounding. It does not reverse the side's entire advantage; it compresses the excess above 90.

That step means a raw rating average over 90 does not translate one for one to the overall result. Stacking deductions, overseas penalty, rivalry penalty, positive bonuses, and diminishing returns all contribute. The resulting overall is rounded to the nearest integer. The breakdown rounds its displayed raw average, stacking impact, and diminishing reduction to one decimal place, so the screen is informative rather than a full-precision audit ledger.

## <span id="use-the-breakdown"></span>Use the breakdown

When comparing two XIs, first check how many selected players actually contribute to the batting and bowling weighted averages. Then review the stacking, overseas, chemistry, rivalry, and identity entries. Do not read the word “penalty” as proof that one player is individually harmful: stacking is a marginal rule triggered by how many high-rated players are in the XI, and overseas is a count-based team deduction.

Finally, separate team strength from match result. The strength formula feeds other match logic, but the simulator uses probabilities and variance. Team preparation choices, current game form, and match events can also matter. A side that loses does not necessarily have a broken calculation; it may have lost a probability-weighted simulation. Learn the [beginner's flow](/guides/play-16-0-play/) and apply the [draft mistake checklist](/guides/draft-mistakes/) before making a new selection.
