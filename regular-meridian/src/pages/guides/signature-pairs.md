---
layout: ../../layouts/GuideLayout.astro
title: "Signature Pairs and Team Chemistry"
description: "All twelve chemistry pairs in the current 16-0 Play engine, their one-point bonus, cap, and roster trade-offs."
slug: signature-pairs
publishDate: "2026-09-29"
updatedDate: "2026-09-29"
readingTime: 7
toc:
  - { id: what-a-pair-does, label: "What a pair does" }
  - { id: all-twelve-pairs, label: "All twelve pairs" }
  - { id: the-cap-and-other-adjustments, label: "The cap and other adjustments" }
  - { id: choosing-pairs-without-breaking-balance, label: "Choose pairs without breaking balance" }
  - { id: name-matching-caveat, label: "Name-matching caveat" }
  - { id: a-pair-based-xi-example, label: "A pair-based XI example" }
related:
  - { title: "Ratings and chemistry", href: "/guides/ratings-star-stacking-chemistry/" }
  - { title: "Build a playing XI", href: "/guides/build-playing-xi/" }
  - { title: "Browse player profiles", href: "/players/" }
---

The 16-0 Play engine contains a fixed list of twelve signature pairs. If both names in one of those pairs are present in the first eleven selected players, the team receives one chemistry point for that pair. The combined chemistry bonus is capped at five. This guide lists the names as they are written in the engine, explains the cap, and shows how to use the rule without treating it as a guarantee of a match result.

The pair list is a game mechanic, not an editorial ranking of cricket partnerships. A pair may be familiar to fans, but its game effect comes from the explicit strings in the source code. No automatic bonus is awarded merely because two players once appeared for the same franchise, played together in a season, or are popular picks. For how chemistry fits the full team-strength formula, read [ratings, stacking, and chemistry](/guides/ratings-star-stacking-chemistry/).

## <span id="what-a-pair-does"></span>What a pair does

The engine makes a lowercase set from names in the selected eleven, then checks each configured two-name pair. When both names occur, it adds one point to `chemistryBonus`. At the end it applies `Math.min(chemistryBonus, 5)`. A complete pair therefore contributes to a bonus that is combined with other overall calculations, but chemistry alone cannot push this field above five.

The pair does not change a player's stored rating. It does not add a separate batting or bowling skill value. Instead, the bonus is added into the team overall calculation. Because batting and bowling are adjusted by the difference between overall and the raw average, that overall change can flow into those displayed team strength values as well. The effect is team-level and mediated by the formula.

## <span id="all-twelve-pairs"></span>All twelve pairs

These are the exact twelve pairs currently defined in `src/lib/engine.ts`:

1. Virat Kohli and AB de Villiers
2. MS Dhoni and Suresh Raina
3. Sunil Narine and Andre Russell
4. Rohit Sharma and Jasprit Bumrah
5. Shane Watson and MS Dhoni
6. Gautam Gambhir and Robin Uthappa
7. KL Rahul and Quinton de Kock
8. Hardik Pandya and Kieron Pollard
9. Shikhar Dhawan and David Warner
10. Faf du Plessis and Ruturaj Gaikwad
11. Shreyas Iyer and Rishabh Pant
12. Yuzvendra Chahal and Kuldeep Yadav

Some pairs use players with long associations in particular eras; others reflect the site's selected game pair data. The engine itself does not display a source citation for why a pair was chosen. The safe description is the game recognizes a combination. Do not extend that into unsupported claims about all seasons together or a real-world chemistry measurement.

You can compare the corresponding player records for [Virat Kohli](/players/virat-kohli/), [AB de Villiers](/players/ab-de-villiers/), [MS Dhoni](/players/ms-dhoni/), and [Suresh Raina](/players/suresh-raina/). Their profile pages show the game's own role and rating data, and some also contain Cricsheet career totals where the player identity was matched confidently. Those career totals do not change the pair rule.

The same function contains four rivalry pairs: Virat Kohli and Gautam Gambhir; Rohit Sharma and David Warner; AB de Villiers and Quinton de Kock; and Hardik Pandya and Pat Cummins. Each complete rivalry subtracts one, with the combined rivalry penalty capped at three. Those names can intersect the signature list. For example, the engine can award a bonus for Kohli–de Villiers while also finding the Kohli–Gambhir rivalry if all three are selected. Both checks still run.

## <span id="the-cap-and-other-adjustments"></span>The cap and other adjustments

Why cap the bonus at five when twelve pairs exist? A single XI can contain several pairs that share a player. If it contains six configured pairs, the chemistry field still contributes five, not six. You should therefore avoid spending lineup places just to collect more than five pairs; the extra qualifying pair would not increase the chemistry value.

Chemistry is separate from team identity. Role-based identities may add one point each for specific batting, bowling, or all-rounder counts. A franchise core of three players earns one point; five or more earns two for that core. Total identity bonus is capped separately at five. The team also has stacking, overseas, rivalry, and diminishing-return calculations. A chemistry pair can be positive while the overall team strength still falls because other deductions exceed its value.

The 90-overall diminishing-return rule also matters. Once the pre-diminishing total exceeds 90, half of the excess is removed. Chemistry is applied before that step. So if a team already has a very high pre-diminishing score, the displayed change from one more chemistry point may be partially compressed by the calculation. It is still one point in the chemistry field; the final rounded overall may not always rise by exactly one.

## <span id="choosing-pairs-without-breaking-balance"></span>Choose pairs without breaking balance

Start with the XI's needs. If you already planned to select Virat Kohli as a batter and AB de Villiers also fits a batting role, the pair can be useful. But if the second name forces you to omit a wicketkeeper or leaves the weighted bowling group thin, compare the whole team calculation before selecting it. The game bonuses are additive, but they do not erase missing role contributions.

Consider overseas limits too. Both players in some pairs may be marked overseas in the player data. The standard first XI cannot exceed four overseas players and the strength formula subtracts one point at two overseas, two at three, and three at four or more. A pair's one-point bonus can coexist with an overseas count deduction. It is not automatically a net positive to add two players from any pair.

Pair picks can also affect rivalries. If you select both AB de Villiers and Quinton de Kock, the source lists that combination as a rivalry penalty. Their pair is not a signature pair, even though both are well-known players. If you add Virat Kohli and Gautam Gambhir to complete another combination, their rivalry is also checked. Learn the whole list rather than inferring a bonus from a remembered association.

## <span id="name-matching-caveat"></span>Name-matching caveat

The engine compares lowercased names as exact strings in a set. It does not normalize punctuation, initials, nicknames, transliterations, or spelling variants at the point of chemistry lookup. The configured pair uses `robin uthappa`, for example. If a roster record instead spells a person differently, the name string may not match that entry. The duplicate page canonical map added for website search does not rewrite the name used by game logic.

This also means canonical URLs and chemistry are separate systems. Canonical tags tell search engines which player page is preferred; they do not merge game cards or mutate stored player names. Use the actual displayed roster name when checking a pair, and treat the provided list as the authoritative version for this build. You can verify candidates on the [player database](/players/).

## <span id="a-pair-based-xi-example"></span>A pair-based XI example

Suppose your planned XI already needs a wicketkeeper and several bowling contributors. You can see that MS Dhoni and Suresh Raina form one listed chemistry pair; adding both will add one chemistry point if the names match exactly. If you also have Shane Watson and MS Dhoni, a second pair is complete. These two bonuses count independently because the pair loop checks each entry. They can share MS Dhoni.

Now look at the cost. If adding Watson pushes the team to four overseas players, the quality penalty is three. If it results in three 92-plus players, stacking also applies. If the batting and bowling weights remain useful and the overall calculation shows the expected bonuses, the choice may fit; if it weakens a role or creates a larger penalty, the pair is not enough on its own to justify the pick.

This kind of arithmetic makes the list useful. Choose combinations that already suit the side, then verify the bonus and all other values in the breakdown. For more examples, use [the XI-building method](/guides/build-playing-xi/), review [common draft mistakes](/guides/draft-mistakes/), and compare the complete [ratings explanation](/rating-system/). A pair is a known rule in the simulator, not a shortcut around the rest of squad construction.
