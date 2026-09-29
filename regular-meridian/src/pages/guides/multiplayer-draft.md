---
layout: ../../layouts/GuideLayout.astro
title: "Multiplayer Draft Guide: The Auction Flow"
description: "Learn how multiplayer rooms, team slots, roster settings, bid timers, and AI picks work in the current 16-0 Play mode."
slug: multiplayer-draft
publishDate: "2026-09-29"
updatedDate: "2026-09-29"
readingTime: 7
toc:
  - { id: make-or-join-a-room, label: "Make or join a room" }
  - { id: set-the-roster-rules, label: "Set the roster rules" }
  - { id: how-the-order-works, label: "How the order works" }
  - { id: bidding-and-timers, label: "Bidding and timers" }
  - { id: automatic-picks-and-ai, label: "Automatic picks and AI" }
  - { id: plan-your-roster-and-purse, label: "Plan your roster and purse" }
  - { id: after-the-auction, label: "After the auction" }
related:
  - { title: "How to build a playing XI", href: "/guides/build-playing-xi/" }
  - { title: "Overseas player strategy", href: "/guides/overseas-players/" }
  - { title: "Game modes", href: "/game-modes/" }
---

The current multiplayer mode is a room-based squad auction. The lobby lets the host configure roster size, a pick timer, an overseas limit, and a short or long auction pool. The source also uses the word “draft” for the overall phase and for automatic AI roster filling, but the human player acquisition screen includes bids, a current bid, a highest bidder, and a purse. This guide describes that implemented flow rather than assuming a conventional snake draft.

Use the lobby controls as the source of truth because settings can vary between rooms. These notes describe the code inspected for this build; details such as server availability and connection quality can change outside the game code. For the single-player roster method, see [how to build a playing XI](/guides/build-playing-xi/).

## <span id="make-or-join-a-room"></span>Make or join a room

The multiplayer system creates a five-character uppercase room code from letters and numbers chosen to avoid confusing characters such as O and I. One user hosts the room and others join with the code. The lobby shows linked users and the number of additional AI slots. The room is designed to contain ten teams in total; when the host starts, empty positions are filled by AI teams using available franchise codes.

The host controls lobby settings. Other participants see the current configuration and cannot change it. The initial settings in the current code are fifteen roster rounds, a ten-second turn timer, a maximum of four overseas players, nine AI teams, and the short auction format. The host can cycle among the allowed values before starting. If there are more human participants, fewer AI slots are needed.

Choose a room with enough time for everyone to understand the rules before the host starts the auction. The room code is a joining credential for the game session, so share it only with the people you want in the room. The interface includes copy and leave controls; leaving disconnects the local participant from that room flow.

## <span id="set-the-roster-rules"></span>Set the roster rules

The roster size can be set to eleven players for an XI-only roster or fifteen for a roster with a bench. The turn timer choices are five, ten, or fifteen seconds. The overseas limit control offers four or five players for the multiplayer draft. The auction pool format can be short or long; the interface labels them as 140 and 320 respectively. Those labels describe available auction pool lengths, not a promise about how many total players each person will select.

The default is fifteen picks and four overseas players. A host who chooses a different configuration changes the constraints the other players work under. Participants should read the roster fraction, overseas count, current budget, and active player details before placing a bid. A roster limit in an auction is not automatically the same as the standard single-player XI rule; the multiplayer match center validates the selected lineup against the room setting.

For a new group, the shorter roster can make choices easier to follow, while a bench-sized roster gives more room to cover roles. The exact balance depends on the people playing. This is a practical suggestion, not a coded advantage. Likewise, choosing a longer auction list provides more candidates, but it does not guarantee that a particular player will appear or be affordable.

## <span id="how-the-order-works"></span>How the order works

When the host starts the multiplayer draft, the application combines human peer IDs and AI team IDs into a draft-order list, then shuffles that list. The starting order is therefore randomized. In the standard draft phase, the active index and round number advance as selections resolve. The code does not reverse the pick order on alternate rounds for human selections, so it should not be described as a classic snake draft unless a later code version changes that behavior.

The application also has AI roster filling that uses a “snake order” comment for how it distributes players among AI rosters. That is a separate operation from the live human auction. Confusing the two can leave players expecting the wrong turn sequence. In the auction stage, a player can bid against other participants; being first in the list does not mean that only one person gets a chance at each player.

If the room has fewer than ten humans, AI franchises fill the remaining team slots. The host's choices of franchise and the list of remaining franchises inform which AI codes are created. AI teams use their own valuation logic during bidding. A human's strategy therefore involves the auction's competition and the roster constraints, not just choosing the next name from a shared alternating list.

## <span id="bidding-and-timers"></span>Bidding and timers

The auction screen shows the active player, current bid, highest bidder, and bid timer. Base prices depend on rating, category, overseas status, and marquee or legends status. Bid increments also depend on the current bid bracket. The source code defines those values; this guide does not repeat the whole price table because it can be read from the current player and bid controls as the auction runs.

The configured turn timer begins at five, ten, or fifteen seconds. When it expires, the state advances through the auction flow. The host's client is responsible for resolving the timer and communicating state updates; the source comments say clients tick locally and re-sync when a game event occurs. A timer is therefore a pacing mechanism, not a guarantee that every user sees identical countdown updates at every instant.

Watch the purse as well as the bid. The default purse is 12,000 lakhs, displayed as ₹120.00 crore. The application also reserves a minimum amount for each remaining roster slot so a team cannot spend its entire purse before filling its roster. The reserve calculation uses ₹20 lakhs per remaining slot. A bid that would breach the reserve or exceed the roster size is rejected by the client-side state logic.

## <span id="automatic-picks-and-ai"></span>Automatic picks and AI

The game has an AI player-selection helper for automatic picks when time runs out or when filling remaining roster slots. It filters already-selected players, checks the current roster's overseas count, and may prioritize a wicketkeeper, batter, or bowler when four or fewer slots remain. It sorts the candidate pool by overall rating and selects the highest remaining candidate in the filtered pool.

If a constrained pool is empty, the helper has a final fallback to the highest-rated available player without applying the overseas filter. That behavior is a code fallback, not a general permission to ignore the room's cap for a human lineup. The match center separately checks the lineup and can reject it if it exceeds the configured maximum. A human should still satisfy the rule rather than relying on an automatic fallback.

AI valuations are not identical to a human budget plan. The engine estimates player value from rating and applies adjustments such as role need, overseas status, and high-rating appeal. AI may stop bidding when a roster has reached its overseas cap. Because these are estimates, they can behave differently from a person using intuition or a favorite-player strategy.

## <span id="plan-your-roster-and-purse"></span>Plan your roster and purse

Before the first bid, sketch a role plan for the roster size chosen. If you select fifteen rounds, decide how the additional players will cover injury-free flexibility or match preparation; if you select eleven, each selection directly contributes to the final group. The game roles affect calculated batting and bowling strength. A balanced set of batters, bowlers, and all-rounders gives you more ways to fill a useful XI than a list of the highest names alone.

Make a budget ceiling for each remaining slot. The software enforces a baseline reserve, but it does not decide what your ideal player is worth. A marquee player can have a higher starting price. Higher-rated players may also have different base price brackets. If two roles are still empty with only a few players left to select, holding enough budget to complete a legal roster is more useful than winning an early bidding contest at any cost.

Keep track of overseas players as you bid. When you hit the room limit, additional overseas candidates are filtered from AI picks, and the match center checks the chosen XI. If the lobby setting is five, the room differs from the standard single-player cap of four. To learn the separate single-player team-strength penalty and the room setting, read [the overseas guide](/guides/overseas-players/).

## <span id="after-the-auction"></span>After the auction

Once the roster is complete, review your team and check the lineup before the season starts. The multiplayer match center lets participants choose an XI and may include match preparation, tactics, and a round simulation sequence. The selected playing XI must fit the room's overseas setting. If a lineup is rejected, count the overseas players first and confirm that the roster has the needed roles.

Multiplayer state is shared through the configured Pusher service. The app sends game messages such as lobby updates, picks, bids, lineup or tactics updates, match results, and chat. A dropped connection can prevent timely state changes, so the UI includes connection guidance. If someone is disconnected, the AI automatic pick helper provides a way for the game flow to continue in some situations; it is not a claim that every network failure will recover without a host action.

The key to a useful session is to agree on settings, know whether the auction pool is short or long, and plan roles and budget before the timer is running. For the broader mode overview, see [Game Modes](/game-modes/). To understand which roster combinations can affect strength, read [team ratings and chemistry](/guides/ratings-star-stacking-chemistry/) and use the [XI-building checklist](/guides/build-playing-xi/).
