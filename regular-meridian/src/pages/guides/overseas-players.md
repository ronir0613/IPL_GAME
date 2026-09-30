---
layout: ../../layouts/GuideLayout.astro
title: "Overseas Players: Building Around the Limit"
description: "How the standard overseas cap and progressive team-strength penalty work in 16-0 Play, with a roster planning method."
slug: overseas-players
publishDate: "2026-09-29"
updatedDate: "2026-09-29"
readingTime: 7
toc:
  - { id: two-separate-rules, label: "Two separate rules" }
  - { id: the-standard-xi-cap, label: "The standard XI cap" }
  - { id: progressive-strength-penalty, label: "Progressive strength penalty" }
  - { id: reserve-and-mode-settings, label: "Reserve and mode settings" }
  - { id: choose-places-by-role, label: "Choose places by role" }
  - { id: a-four-player-example, label: "A four-player example" }
  - { id: quick-check-before-starting, label: "Quick check before starting" }
related:
  - { title: "Build a playing XI", href: "/guides/build-playing-xi/" }
  - { title: "Ratings and team chemistry", href: "/guides/ratings-star-stacking-chemistry/" }
  - { title: "Player database", href: "/players/" }
---

Each player profile shows whether the player is counted as overseas in 16-0 Play. This affects both who you can select and your team's calculated strength. These are separate rules: a maximum determines whether the XI is accepted, while a progressive deduction can lower team strength even when the XI is legal. Keeping the two rules separate helps you weigh the trade-off.

This guide explains the standard lineup and points out where multiplayer settings differ. These are rules for 16-0 Play; real-world league rules may be different. For the broader role and rating method, see [how to build a playing XI](/guides/build-playing-xi/) and [team-strength calculations](/guides/ratings-star-stacking-chemistry/).

## <span id="two-separate-rules"></span>Two separate rules

The first rule is a selection limit. A standard XI can include up to four overseas players. Once you reach that number, the lineup screen will not let you add another one. Match preparation checks the same limit before you continue, helping prevent an invalid XI.

The second rule is a strength penalty. The game counts overseas players in the XI and subtracts points from team overall based on that number. This penalty does not reject the lineup: a team can meet the limit and still receive a deduction. Check both the overseas count and the overall breakdown.

Neither rule should be described as a statement about the quality of overseas players as people or athletes. The penalty is a simplified balance mechanic applied to the team's count. A single overseas player has no deduction in the strength calculation; the penalties begin with the second player.

## <span id="the-standard-xi-cap"></span>The standard XI cap

For a standard single-player XI, the limit is four. The game will block a fifth overseas player, even if that player would fill a role the other ten players do not cover. Find a legal option to fill the gap.

Some squad screens also have reserve or impact-bench concepts. The normal match preparation screen separately selects an XI and an impact bench, and the ready state checks that the XI has eleven and the bench has five while the overseas count in the XI is at most four. The cap in this context refers to the playing XI. It should not be casually generalized to the total size of the roster if that roster includes substitutes not in the starting eleven.

Because selection screens can have their own data and state, always read the current counter next to the lineup. If it displays `4/4`, the maximum has been reached. A player may still be available in the player pool or on the bench; that does not make them valid in an additional XI slot.

## <span id="progressive-strength-penalty"></span>Progressive strength penalty

The overseas deductions are:

- Zero or one overseas player: no overseas penalty.
- Exactly two: subtract one point.
- Exactly three: subtract two points.
- Four or more: subtract three points.

Four is the standard XI limit, so “four or more” means four in a valid lineup. The penalty increases by one point at each threshold: moving from one overseas player to two adds one point; moving from two to three adds another; moving from three to four adds one more. You can see the deduction in the strength breakdown.

This amount interacts with chemistry, team identity, rivalry, star stacking, and diminishing returns. If you add an overseas player who completes a listed signature pair, you might gain a chemistry point and also cross an overseas threshold. The final effect depends on both values and the rest of the XI. If you add a player while staying at the same overseas count, there is no new overseas threshold change, though the player's rating and role still affect strength.

The game uses the overseas status shown on each player profile. It does not infer a player's nationality from their name or require a particular mix of countries.

## <span id="reserve-and-mode-settings"></span>Reserve and mode settings

The multiplayer lobby offers an overseas limit of four or five. The room's setting can therefore differ from the standard single-player maximum. Multiplayer also offers eleven-player or fifteen-player rosters, so distinguish the full roster from the active XI.

Before a multiplayer match, the selected XI is checked against the limit chosen by the host. A room may allow five overseas players, but the standard single-player limit remains four. Check the lobby before building your team around a specific limit.

This difference makes a general “you can never use five” statement inaccurate across the whole site. The safe wording is: standard single-player XI maximum four; multiplayer lobby can be set to four or five and validates against the selected room setting. When writing about a particular screen, name the mode.

## <span id="choose-places-by-role"></span>Choose places by role

Plan overseas picks after outlining the roles you need. The team-strength formula weights the player overall by their role: pure batters and wicketkeepers count fully toward batting; pure bowlers count fully toward bowling; all-rounder variants contribute to both in different proportions. An overseas pick can therefore fill a genuine role gap, but the same role might be available from a domestic player in the data. Compare their contribution in context.

Do not spend all four places early merely because four slots are permitted. If an overseas player completes a pair in the chemistry list, compare the one-point pair bonus with the progressive penalty. If the pair is already planned, it can be worth including when both players make sense for the XI. If the pair forces you into an imbalanced role composition or causes the team to cross a penalty threshold, evaluate the whole team-strength breakdown.

Overseas status is also separate from rating thresholds. A 95-rated overseas player counts toward both the 95-plus stacking rule and the overseas limit. A third 92-plus player can also receive the stacking deduction described in the [star-stacking guide](/guides/ratings-star-stacking-chemistry/). These effects can apply together, so a high rating may still come with a roster cost.

## <span id="a-four-player-example"></span>A four-player example

Imagine an XI that needs a high-rated top-order batter, a wicketkeeper, bowling coverage, and one all-rounder. You choose three overseas players. That is legal under the standard cap and produces a two-point overseas penalty. A fourth overseas player might improve a role or complete a chemistry pair, but it moves the penalty to three points. The question is not “is the fourth player good?”; it is whether that additional role or bonus is worth the incremental team-level deduction and the opportunity cost of the slot.

Now compare a domestic option with a slightly lower rating who fills the same gap. If choosing the domestic option leaves the overseas count at three, the one-point difference between penalty tiers is preserved. The domestic player can also alter the role weighted averages. Because multiple calculations change at once, compare the resulting values rather than assuming a single attribute settles the choice.

If your multiplayer lobby is set to five, you can build around that room's limit. Check the selected XI before the match, since lineup rules depend on the mode and room settings.

## <span id="quick-check-before-starting"></span>Quick check before starting

Before you start a standard season, count the overseas markers in the playing XI and confirm there are four or fewer. Then read the overseas penalty in the breakdown: zero or one player has none, two has one, three has two, and four has three. Recheck after every substitution or lineup change because the count may cross a threshold.

For multiplayer, note the host's roster and overseas settings first, then check the lineup counter against those settings. For more selection help, see the [XI-building guide](/guides/build-playing-xi/) and review the [signature-pair list](/guides/signature-pairs/). The [player profiles](/players/) show each player's overseas status, role, and rating.
