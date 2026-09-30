---
layout: ../../layouts/GuideLayout.astro
title: "How to Play 16-0 Play: A Beginner’s Guide"
description: "A practical first run through squad selection, player roles, team strength, match events, and the 16-0 Play season simulator."
slug: play-16-0-play
publishDate: "2026-09-29"
updatedDate: "2026-09-29"
readingTime: 7
toc:
  - { id: start-with-the-squad, label: "Start with the squad" }
  - { id: understand-player-roles, label: "Understand player roles" }
  - { id: choose-for-team-strength, label: "Choose for team strength" }
  - { id: what-happens-in-a-season, label: "What happens in a season" }
  - { id: read-match-events, label: "Read match events" }
  - { id: learn-by-reviewing, label: "Learn by reviewing" }
  - { id: a-first-run-checklist, label: "A first-run checklist" }
related:
  - { title: "Ratings and chemistry", href: "/guides/ratings-star-stacking-chemistry/" }
  - { title: "Build a playing XI", href: "/guides/build-playing-xi/" }
  - { title: "Game modes", href: "/game-modes/" }
---

16-0 Play is a cricket squad-building simulator. You select players, assemble a side, and follow simulated fixtures against other teams. The name describes the challenge: try to finish with sixteen wins and no losses. The game has several screens and settings, so a good first attempt starts with understanding the squad you are building instead of immediately selecting the highest numbers.

The guide focuses on the rules currently implemented in the game. Ratings are internal game values, and simulated scores are entertainment rather than official cricket records or forecasts. Start from the [game modes overview](/game-modes/) if you want to compare the available entry points, then return here for the core selection process.

## <span id="start-with-the-squad"></span>Start with the squad

The main squad builder gives you a pool of players with ratings, roles, teams, and an overseas marker. In the standard lineup flow, the playing side is eleven players. Some screens also let you save reserve players: the match preparation screen can use a starting XI plus an impact bench, while the core first-run lineup asks you to fill eleven places. The exact setup depends on the mode you enter, so read the roster count shown on the screen rather than assuming every mode has the same squad size.

Pick with a plan. Decide which players will open, who can cover the middle overs, and how you will take wickets. The interface does not make those tactical choices for you; it shows your selected roster and team breakdown so you can see the composition before you begin. A useful first step is to add a wicketkeeper, several batting options, and several bowling options, then use all-rounders to connect those parts of the lineup.

You can revisit the [player profiles](/players/) to compare ratings. A profile may also include Cricsheet IPL career totals when the player's identity was matched confidently. Those recorded match totals are separate from the game's rating: one describes IPL records, while the other is a value used to balance this game.

## <span id="understand-player-roles"></span>Understand player roles

Roles affect how a player's rating contributes to your batting and bowling strengths. A pure batter or wicketkeeper contributes to batting; a pure bowler contributes to bowling. All-rounder roles help with both, to different degrees. For example, an `AR` helps batting and bowling equally; `BAT_AR` contributes more to batting, while `BOWL_AR` contributes more to bowling.

This is why role labels are more useful than treating every rating as interchangeable. If you fill every position with batters, the raw batting figure may look strong, but the bowling figure will lack contributions from bowling roles. A player with a slightly lower number who covers a missing role can change the balance calculation more than another player who repeats a role you already have in abundance. The game also grants a small identity bonus for some extreme role distributions, but that is not a substitute for covering both sides of the match.

For more detail on weights and bonuses, read [how ratings, star stacking, and chemistry work](/guides/ratings-star-stacking-chemistry/) and visit the [rating system page](/rating-system/).

## <span id="choose-for-team-strength"></span>Choose for team strength

Team strength is not simply the average of eleven ratings. The game weighs players according to their roles, then adjusts the team's overall value for high-rated-player stacking, overseas count, signature chemistry, rivalries, and team identity. Ratings above 90 have a diminishing effect on the final value. The lineup breakdown is more useful than the headline overall alone because it shows how those choices combine.

The first practical constraint is the overseas limit. The standard first XI allows up to four overseas players. A fifth cannot be used in that lineup. In addition, the strength calculation subtracts a progressive quality penalty when the XI includes two or more overseas players. This penalty does not mean overseas players are individually bad; it means that choosing several of them has a cost in this specific team-strength formula. See the [overseas player guide](/guides/overseas-players/) before filling all four spaces automatically.

The second practical constraint is diminishing value at the top end. A 95-rated player is still strong, but a side with many elite numbers can lose some of the expected advantage through stacking penalties and the overall cap-like diminishing calculation. This makes balance a real part of selection. It also means you should compare players by role, team, and the side's combined structure rather than using a one-number ranking as your only rule.

## <span id="what-happens-in-a-season"></span>What happens in a season

Each season has ten teams split into two groups of five. Teams in the same group meet twice; teams in different groups meet once, with one opponent repeated. That makes fourteen league matches per team. The top four then enter the playoffs: first versus second in Qualifier 1, third versus fourth in the Eliminator, followed by Qualifier 2 and the Final.

The “16-0” name is a challenge, not the number of league matches. Each team plays fourteen league matches, followed by playoffs for the teams that qualify. How many of those matches you personally manage can depend on the mode and season screen.

League points come from results. A win adds two points; an abandoned rain match adds one point to each side and does not alter net run rate. A season can include playoffs after the league table is sorted. For the bracket layout and the end-of-season screens, see [game modes](/game-modes/) and the [rain-event guide](/guides/dls-rain-events/).

## <span id="read-match-events"></span>Read match events

Some matches include a rain marker. The game can abandon a regular-season match with no result or reduce the overs and label the result DLS. This is a simplified game event, not a full official Duckworth–Lewis–Stern calculation. Reduced-over results can also happen in playoffs, while playoff matches are not abandoned by this rain rule.

Player form is another game-only input. The form system scores a player's recent generated performances, stores up to the last five, and maps the score into categories. The squad form bonus affects win probability and is capped at plus or minus six percentage points. This is not the player's real-life current form. It is state created by the simulator during your run. The [form and ratings guide](/guides/ratings-star-stacking-chemistry/) explains how to separate internal mechanics from real career records.

## <span id="learn-by-reviewing"></span>Learn by reviewing

After the match, check the result and any available player performance summary. Ask a specific question: Did the side have enough bowling roles? Did the overseas count add a penalty? Did the team get a chemistry bonus, or did it contain a listed rivalry? Was a reduced-overs event involved? Looking at a single result in this way is more informative than treating a loss as proof that one player rating is wrong.

Match outcomes include randomness. The game uses probabilities, so a stronger team can still lose. A winning streak does not guarantee another win, and a player's historical IPL stats do not predict what the simulator will produce. Use results to learn how this game works rather than to make claims about real-world player quality.

The player profile's rating and career section answer different questions. The rating is used by the game, while Cricsheet totals summarize recorded IPL matches for players who could be matched confidently. If a profile has no career section, it means the identity could not be confirmed for those totals; it does not mean the player has no real-world career.

## <span id="a-first-run-checklist"></span>A first-run checklist

Before beginning, check that you have eleven players, a wicketkeeper, a mix of batting and bowling roles, and no more than four overseas players in the standard XI. Scan the team-strength breakdown rather than just the overall score. If a pair appears in the [signature pair list](/guides/signature-pairs/), it can add to chemistry, but do not sacrifice a missing role merely to include a pair. Keep the [common draft mistakes guide](/guides/draft-mistakes/) nearby if you want a second pass over your choices.

Then play a complete run and note what the game shows. Look at the standings, results, and any rain or playoff events. The [rating-system reference](/rating-system/) and linked guides explain the values behind your lineup. Treat “16-0” as a challenge, not a guarantee. That gives you a clear starting point and a practical way to improve your next XI.
