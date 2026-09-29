---
layout: ../../layouts/GuideLayout.astro
title: "Ten Draft Mistakes and How to Avoid Them"
description: "Ten common roster-building traps in 16-0 Play, with a practical check for roles, ratings, overseas places, and chemistry."
slug: draft-mistakes
publishDate: "2026-09-29"
updatedDate: "2026-09-29"
readingTime: 7
toc:
  - { id: chasing-only-the-top-rating, label: "1. Chasing only the top rating" }
  - { id: ignoring-role-weights, label: "2. Ignoring role weights" }
  - { id: forgetting-the-overseas-threshold, label: "3. Forgetting the overseas threshold" }
  - { id: treating-pair-bonus-as-a-plan, label: "4. Treating a pair as a plan" }
  - { id: overlooking-rivalry-pairs, label: "5. Overlooking rivalry pairs" }
  - { id: overfilling-the-elite-tier, label: "6. Overfilling the elite tier" }
  - { id: confusing-a-bench-with-the-xi, label: "7. Confusing a bench with the XI" }
  - { id: misreading-form-and-career-stats, label: "8. Misreading form and career data" }
  - { id: expecting-a-snake-draft, label: "9. Expecting a snake draft" }
  - { id: blaming-every-loss-on-your-roster, label: "10. Blaming every loss on your roster" }
related:
  - { title: "Build a playing XI", href: "/guides/build-playing-xi/" }
  - { title: "Ratings and chemistry", href: "/guides/ratings-star-stacking-chemistry/" }
  - { title: "Multiplayer auction flow", href: "/guides/multiplayer-draft/" }
---

A draft can look impressive and still leave a team short of bowling options, over the overseas limit, or exposed to stacking deductions. The best way to avoid those problems is to check how the current game calculates the XI, not to copy a generic fantasy-cricket checklist. These ten mistakes focus on concrete rules in the 16-0 Play code and interface.

## <span id="chasing-only-the-top-rating"></span>1. Chasing only the top rating

The first mistake is to treat the largest individual number as the only selection rule. Team strength uses eleven players, role weights, and several bonuses and deductions. A high rating can help, but it may trigger star-stacking rules or fail to cover a missing specialty. Before choosing, ask what the player adds to this exact XI. Compare the resulting overall and batting/bowling values in the breakdown rather than looking only at the new name's rating.

## <span id="ignoring-role-weights"></span>2. Ignoring role weights

Every role contributes differently. A pure batter does not add to the bowling weighted average, while an `AR` contributes to both. Choosing too many of one type can leave a weak specialty value. The engine does not automatically reorder your XI to fix that. Use a role map before filling the final places and inspect the weighted totals. For exact weights, follow the [ratings guide](/guides/ratings-star-stacking-chemistry/).

## <span id="forgetting-the-overseas-threshold"></span>3. Forgetting the overseas threshold

The standard XI has a four-player cap, but the strength penalty begins before the cap. Two overseas players incur one point; three incur two; four incur three. A fifth is not accepted in the standard XI. The common trap is to count only legality and overlook the penalty, or to see the penalty and assume it is a hard rejection. They are separate checks. Read the [overseas guide](/guides/overseas-players/) and distinguish single-player rules from multiplayer settings.

## <span id="treating-pair-bonus-as-a-plan"></span>4. Treating a pair as a plan

A signature pair adds one chemistry point when both exact names appear, and the total chemistry bonus is capped at five. That is useful when both players fit your role plan. It is not a substitute for roles, and the pair does not guarantee a win. Build a functional side first, then check which listed pairs your selections already complete. The [complete twelve-pair list](/guides/signature-pairs/) prevents guesses based on player associations that the code does not recognize.

## <span id="overlooking-rivalry-pairs"></span>5. Overlooking rivalry pairs

The same formula contains rivalry combinations that subtract one point each, up to a cap of three. A team can trigger a positive signature pair and a negative rivalry pair at once. For example, if the XI includes Virat Kohli, AB de Villiers, and Gautam Gambhir, the engine's Kohli–de Villiers chemistry and Kohli–Gambhir rivalry checks both apply. Inspect both fields instead of celebrating a bonus without checking the rest of the pair list.

## <span id="overfilling-the-elite-tier"></span>6. Overfilling the elite tier

For the selected eleven, the first two players at 92 or above avoid the 92-plus deduction; each additional one incurs two points against that player's effective contribution. For 95-plus players, the first avoids the extra tier, and additional 95-plus players incur three more points. A later 95-plus player can trigger both deductions because it also belongs to the 92-plus group. The star-stacking penalty is averaged into the team calculation, so look at the breakdown when adding another elite rating.

## <span id="confusing-a-bench-with-the-xi"></span>7. Confusing a bench with the XI

Some screens provide reserve players or an impact bench, but team strength uses the first eleven filled slots. A reserve does not affect that calculation until the lineup or match preparation feature brings the player into the playing XI. The match preparation screen has its own readiness conditions for eleven players and a five-player impact bench. Check which roster is being evaluated instead of assuming every selected player contributes to the displayed team overall.

## <span id="misreading-form-and-career-stats"></span>8. Misreading form and career data

Game form is built from generated player performances during the run, while a career table on a profile comes from matched Cricsheet IPL records. They are different data sources. A player with a strong real-career total does not get an automatic simulator form bonus from that table. The game form system keeps up to five performances and uses a category-based squad bonus. Also, no career section means the identity match was not reliable enough to publish, not that the player lacks real stats.

## <span id="expecting-a-snake-draft"></span>9. Expecting a snake draft

The multiplayer code randomizes the participant order at the start, but human player acquisitions use an auction screen with bids, highest bidder, purses, and a timer. The order does not reverse on alternate rounds in the inspected live flow. A separate AI-roster fill comment uses snake order. If you expect a classic serpentine draft, you may misunderstand why a bid is active or how an AI pick was made. Read the [multiplayer auction guide](/guides/multiplayer-draft/) before joining a room.

## <span id="blaming-every-loss-on-your-roster"></span>10. Blaming every loss on your roster

The match engine uses probability and random outcomes; calculated strength is not a promise. One defeat does not prove that your team has the wrong players. Review the available match data: did a rain event occur, did the opponent have a higher calculated strength, were player forms low, or did a close probability draw go against you? Make one change at a time when possible so you can tell which rule affected the breakdown. The [beginner's guide](/guides/play-16-0-play/) explains the season and result flow.

## A better final pass

Before starting, count eleven players and verify your role coverage. Count overseas markers and note the exact penalty threshold. Check for both chemistry and rivalry. Review the elite-player stacking fields, then see whether an overall above 90 is being reduced. If the mode includes a bench, distinguish those players from the active XI. For multiplayer, check the host's settings and keep enough purse for the remaining required slots.

This method will not remove uncertainty from a simulated match, and it does not promise a perfect record. It does make your choices easier to explain: each pick has a role, each threshold has a known effect, and each adjustment can be compared in the game screen. Start with [the XI-building guide](/guides/build-playing-xi/) and use the [player database](/players/) to inspect the stored ratings and roles before the next attempt.
