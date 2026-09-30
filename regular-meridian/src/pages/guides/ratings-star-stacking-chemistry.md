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

The examples below explain how the game's current rating rules affect your lineup. They are written to help you read the strength breakdown and compare choices. For a step-by-step selection method, see [how to build a playing XI](/guides/build-playing-xi/).

## <span id="what-a-player-rating-means"></span>What a player rating means

Each player profile shows a rating and a role. The game uses the rating in several team calculations. Cricsheet career totals are separate: they summarize recorded runs and wickets, while the in-game rating is a value used to balance this simulator.

This distinction matters when discussing examples. Calling a player “high-rated” means the game's rating is high; it is not an independent claim that the player is objectively better than another cricketer. Think of ratings as balancing values for this game. Browse the [player profiles](/players/) and use the [Cricsheet career section](/guides/play-16-0-play/) when a player's record has been matched confidently.

## <span id="role-weights-and-team-averages"></span>Role weights and team averages

Strength uses the first eleven filled squad slots. For batting, `BAT` and `WK` count at full weight, `BAT_AR` at full weight, `AR` at 0.75, and `BOWL_AR` at 0.25. Pure `BOWL` contributes no batting weight. For bowling, pure `BOWL` and `BOWL_AR` count at full weight, `AR` at 0.75, `BAT_AR` at 0.25, and pure `BAT` or `WK` contribute no bowling weight. Each specialty score is the weighted rating total divided by the sum of the applicable weights.

The game averages the filled players' ratings, then accounts for stacking. It adds bonuses and subtracts penalties to reach the team's overall value. Batting and bowling figures are then adjusted in relation to that overall. The displayed numbers are connected, so they are not separate predictions of how many runs your team will score or wickets it will take.

This is why role depth has value. Imagine adding one more batter when the XI already has several, versus replacing a pure batter with an all-rounder who contributes to bowling as well. The second choice can change the denominator and weighted total for both specialty calculations. The all-rounder does not automatically make the side superior; the result depends on the rest of the eleven and the exact weights. The useful question is whether the roster has enough options in both disciplines for the simulation's team calculation.

## <span id="star-stacking-rules"></span>Star-stacking rules

For the stacking check, the selected players are considered from highest rating to lowest. The first two players rated 92 or above avoid the 92-plus deduction; each additional player in that group loses two effective rating points. The first player rated 95 or above avoids the extra 95-plus deduction; each additional 95-plus player loses three more points. Since a 95-plus player also belongs to the 92-plus group, a later player in that tier can receive both deductions.

These are not one fixed subtraction from the finished team score. The deductions reduce the affected players' effective ratings before the team average is calculated. The stacking figure in the breakdown is the total deduction spread across the filled players. For example, if two players each lose points, the effect on the team's average is smaller than simply subtracting both deductions from the final team value.

For example, a roster with two 92-plus players does not incur a deduction at the 92 threshold. A third player at 92 or above loses two points from their effective rating. If two or more players are 95-plus, every player after the first also loses three points at that threshold. A later player who is in both groups can receive both deductions. Only the active first eleven count; reserves do not affect this strength calculation.

## <span id="chemistry-and-rivalries"></span>Chemistry and rivalries

The game recognizes a set of specific player pairs. When both listed players are in the XI, that pair adds one chemistry point. The total chemistry bonus cannot exceed five, even if your XI includes more qualifying pairs. The names shown on the player cards determine which combinations count.

There is also a rivalry list. Each complete rival pair subtracts one point, and the combined rivalry penalty is capped at three. The bonus and penalty lists are independent, so a XI can contain both a chemistry pair and one or more rival pairs. This is a simplified game rule, not a statement about real relationships between the named players. It is best described as “the game recognizes this combination,” not as a factual claim about whether players get along.

The complete lists appear in [the signature-pairs guide](/guides/signature-pairs/). Virat Kohli and AB de Villiers earn a bonus, while Virat Kohli and Gautam Gambhir trigger a rivalry deduction. MS Dhoni and Suresh Raina are another bonus pair. Use the names as they appear on the player cards when checking a combination.

## <span id="identity-and-franchise-bonuses"></span>Identity and franchise bonuses

Three role-based identities can add one point apiece. “Batting-Heavy” appears with at least seven `BAT` or `WK` players. “Bowling-Heavy” appears with at least five `BOWL` players. “All-Rounder Army” appears with at least four `AR`, `BAT_AR`, or `BOWL_AR` players. These are specific game thresholds; they are not an overall judgment that a team is balanced.

The game also rewards keeping a franchise core together. Three players from the same team add one point; five or more add two points for that team. Different franchise cores can each contribute, up to a combined team-identity cap of five. A five-player core receives the two-point tier rather than both tiers.

Role identities and franchise cores stack with signature chemistry. Therefore, the displayed `teamIdentityBonus` can include more than one reason, while `chemistryBonus` is kept in its own field. The identity labels in the returned breakdown tell you which role identity or franchise core was found. This gives you a way to reason about a roster: one familiar pair may be worth one chemistry point, while a same-team core can earn a separate identity contribution.

## <span id="diminishing-returns"></span>Diminishing returns

After averages and bonuses are combined, half of any amount above 90 is removed. For example, a value of 94 becomes 92 before rounding. This narrows the extra advantage above 90 without erasing it.

That step means a raw rating average over 90 does not translate one for one to the overall result. Stacking deductions, overseas penalty, rivalry penalty, positive bonuses, and diminishing returns all contribute. The resulting overall is rounded to the nearest integer. The breakdown rounds its displayed raw average, stacking impact, and diminishing reduction to one decimal place, so the screen is informative rather than a full-precision audit ledger.

## <span id="use-the-breakdown"></span>Use the breakdown

When comparing two XIs, first check how many selected players actually contribute to the batting and bowling weighted averages. Then review the stacking, overseas, chemistry, rivalry, and identity entries. Do not read the word “penalty” as proof that one player is individually harmful: stacking is a marginal rule triggered by how many high-rated players are in the XI, and overseas is a count-based team deduction.

Finally, separate team strength from match results. The game uses probabilities, so a stronger team can still lose. Preparation choices, current in-game form, and match events can also matter. One defeat does not mean your lineup is wrong. Learn the [beginner's flow](/guides/play-16-0-play/) and use the [draft mistake checklist](/guides/draft-mistakes/) before making another selection.
