# 🏏 16-0 Play: The Ultimate Cricket Strategy Game & Team Builder

[![Live Website](https://img.shields.io/badge/Live-16--0%20Play-gold?style=for-the-badge&logo=cricket)](https://16-0play.com/)
[![Astro](https://img.shields.io/badge/Astro-v7.0-FF5D01?style=for-the-badge&logo=astro)](https://astro.build/)
[![React](https://img.shields.io/badge/React-v19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![P2P Multiplayer](https://img.shields.io/badge/Multiplayer-WebRTC%20P2P-green?style=for-the-badge&logo=webrtc)](https://peerjs.com/)

**16-0 Play** is an immersive, high-fidelity cricket strategy and team-building simulator. Draft your all-time dream playing XI, manage squad chemistry and ratings, make crucial tactical decisions, and attempt to achieve the ultimate cricket challenge: a perfect, undefeated **16-0 season**. 

Play the game live now at: **[https://16-0play.com/](https://16-0play.com/)**

---

## 🚀 Key Features

### 1. Build Your Greatest Playing XI
* **All-Time Rosters:** Choose from a vast database of cricket legends, current T20 superstars, and franchise heroes.
* **Squad Balance & Constraints:** Draft a realistic squad. Balance your top-order, middle-order, wicketkeepers, all-rounders, spinners, and fast bowlers.
* **Tactical Rules:** Stay within constraints like the maximum overseas player limits.

### 2. Deep Squad Management Engine
To ensure strategic depth and prevent simple "star hoarding," the simulator runs advanced rating calculations:
* **Star Stacking Penalty:** Accumulating too many top-rated players (92+ or 95+ OVR) introduces diminishing returns due to ego clashes and shared roles.
* **Overseas Quality Penalty:** Exceeding standard overseas player thresholds applies squad penalties, forcing you to value local talent.
* **Team Chemistry & Signature Pairs:** Pair legendary duos (e.g., *Virat Kohli & AB de Villiers*, *MS Dhoni & Suresh Raina*, *Rohit Sharma & Jasprit Bumrah*) to unlock chemistry boosts and bolster your overall match performance.
* **Dynamic Form & Trends:** Track player form with visual sparklines. Player performance changes dynamically match-by-match.

### 3. Advanced Simulation & Match Center
* **Ball-by-Ball Simulator:** Experience the tension with detailed commentaries, live scorecard updates, and key moment descriptions.
* **DLS Method & Rain Events:** Realistic weather interruptions can dynamically shorten matches or result in washouts, calculated via the Duckworth-Lewis-Stern algorithm.
* **Season Analytics:** Access full player stats, player of the match awards, leaderboard records, and dynamic season narratives/news.

### 4. Real-Time P2P Multiplayer (WebRTC)
* **Snake Draft Lobbies:** Host or join multiplayer rooms with up to 10 players. Draft players in a traditional "snake" order (`P1 -> P2 -> P3 -> P4`, then `P4 -> P3 -> P2 -> P1`) for absolute fairness.
* **Fully Serverless:** Built entirely on a Peer-to-Peer architecture using **PeerJS**. The host's browser acts as the authoritative server, eliminating expensive server and database hosting costs.
* **Fallback AI:** Disconnected users are seamlessly replaced by an automated draft AI to keep the lobby running smoothly.

---

## 🛠️ Tech Stack

* **Core & SEO:** [Astro v7](https://astro.build/) (Static Site Generation, SEO meta tags, canonical links, JSON-LD schema)
* **Interactive UI:** [React v19](https://react.dev/) (State management, interactive components, dynamic screens)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (Modern layout, utility styling, premium dark/light themes)
* **Animations:** [Framer Motion](https://www.framer.com/motion/) (Smooth transitions, cards, and list animations)
* **Networking:** [PeerJS](https://peerjs.com/) (WebRTC Peer-to-Peer synchronization for multiplayer lobbies)
* **Deployment:** [Cloudflare Pages](https://pages.cloudflare.com/) (High-performance serverless deployment)

---

## 📂 Project Structure

```text
IPL_GAME/
├── .agents/                    # Custom AI developer instructions and rules
├── regular-meridian/           # Primary Astro + React codebase
│   ├── public/                 # Static assets (images, icons, manifest)
│   ├── src/
│   │   ├── components/         # React Components (App.tsx, MpScreens.tsx, etc.)
│   │   ├── lib/                # Logic & Engine (engine.ts, multiplayer.ts, types.ts)
│   │   ├── pages/              # Astro pages (index.astro)
│   │   └── styles/             # Global CSS and Tailwind variables
│   ├── wrangler.toml           # Cloudflare Pages / Wrangler configuration
│   ├── astro.config.mjs        # Astro project settings
│   └── package.json            # Node dependencies and scripts
└── README.md                   # This documentation file
```

---

## 💻 Local Setup & Development

Follow these steps to run the project locally on your machine.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (version `>= 22.12.0` is recommended).

### Steps
1. Navigate to the project folder:
   ```sh
   cd regular-meridian
   ```

2. Install the dependencies:
   ```sh
   npm install
   ```

3. Run the development server in background mode (per CLI recommendation):
   ```sh
   npm run dev
   ```

4. Open your browser and navigate to:
   ```text
   http://localhost:4321
   ```

### Additional Build Commands
* **Production Build:** `npm run build` (compiles production bundle to `/dist`)
* **Local Preview:** `npm run preview` (previews the production bundle locally)
* **Cloudflare Deployment:** `npm run deploy` (builds and deploys to Cloudflare Pages)

---

## 🔮 Future Roadmap

* [x] **Lobby Setup & Custom Settings** (Room creation, dynamic timers, roster constraints)
* [x] **Snake Draft Engine** (Pick synchronization, turn timer, draft feeds, filterable player pool)
* [x] **Multiplayer Match Simulation** (Live Match Center, standings tracker, playoffs bracket)
* [ ] **IPL Auction Room** (Real-time bidding-style multiplayer format)
* [ ] **Historical Seasons & Challenge Scenarios**

---

## 📄 License
This project is proprietary. All rights reserved. Created by [ronir0613](https://github.com/ronir0613).
