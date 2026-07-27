# 16-0 Play: Future Plans & Roadmap

This file outlines the future plans and roadmap for **16-0 Play**, specifically focusing on the integration of a new game mode: the **IPL Auction Room**.

---

# 16-0 Play: Future Plans & Roadmap

This file outlines the future plans and roadmap for **16-0 Play**, focusing on adding a **4th mode: Multiplayer Snake Draft**.

---

## 🚀 Priority Goal: Multiplayer Snake Draft Mode (Format B)

A real-time multiplayer draft mode where players join a lobby, take turns drafting cricketers in a "snake" format, customize their playing XI, and compete in a simulated league tournament.

### 📋 Phase 1: Lobby Setup & Custom Settings
* **Room Creation**: A host creates a room and shares a code. Up to 10 players can join.
* **Dynamic Host Settings**:
  * **Draft Rounds**: E.g., 11 rounds (starting XI only) or 15–18 rounds (squad with bench).
  * **Turn Timer**: 30s, 45s, or 60s per pick.
  * **Roster Constraints**: Max overseas players (e.g., max 4), minimum requirements per role (e.g., 1 WK, 3 BAT, 3 BOWL).
  * **Order Generation**: Randomized, host-defined, or based on previous season rank.

### 👥 Phase 2: Bidding/Pick Synchronization (The Snake Draft)
* **The Snake Order**: 
  * In Round 1, players pick in order: `P1 -> P2 -> P3 -> P4`.
  * In Round 2, the order reverses: `P4 -> P3 -> P2 -> P1` (to keep it fair for the last picker).
* **Draft Board UI**:
  * **Turn Indicator**: Clear visual highlight and countdown timer on the active picker.
  * **Draft Feed**: Real-time log of recent picks (e.g., *"RCB selected Virat Kohli"*).
  * **Player Pool**: Filterable list of available cricketers (WK, BAT, AR, BOWL, Overseas) with search. Selected players are locked instantly.
  * **Roster Progress**: A sidebar showing each player's filled positions and current team overall.

### 🌐 Phase 3: Match Sim & Tournament Loop
* **Tactical Lineups**: Before each match round, players select their playing XI, choose their captain, and designate an Impact Player.
* **Simulated Matches**:
  * Matches are simulated round-by-round.
  * A **Live Match Center** shows mini-scoreboards and commentaries of concurrent matches (e.g., User A vs User B, User C vs AI).
* **Standings Table**: Points table updates live, progressing to a Top 4 Playoff bracket to crown the champion.

---

## 🛠️ Infrastructure & Tech Stack (P2P WebRTC)

To avoid high database costs and monthly hosting fees, we will build this using a Peer-to-Peer architecture:
* **Host acts as Server**: The browser of the player who creates the room serves as the authoritative host. It holds the draft order, active player pool, draft timer, and runs the match simulation engine.
* **Clients connect via WebRTC**: Other players connect directly to the host's browser using **PeerJS**. 
* **State Synchronization**:
  * When it's P1's turn, P1 selects a player ➔ sends `PICK_PLAYER` message to Host.
  * Host validates pick ➔ removes player from pool ➔ broadcasts `DRAFT_UPDATE` (updated rosters, next picker, reset timer) to all connected clients.
* **Fallback AI**: If a client disconnects during their turn, the Host automatically auto-drafts the highest overall player matching their roster requirements once the timer runs out.

---

## 🔮 Future Extension: IPL Auction Room (Format A)
* Once the multiplayer Snake Draft infrastructure (PeerJS, lobby sync, live draft board, tournament simulator) is fully stable, we will add the **Auction (Bidding) format** as a toggle in the lobby settings.

