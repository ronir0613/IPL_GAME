CREATE TABLE IF NOT EXISTS leaderboard (
  id TEXT PRIMARY KEY,
  date TEXT,
  mode TEXT,
  wins INTEGER,
  losses INTEGER,
  points INTEGER,
  nrr REAL,
  position INTEGER,
  champion INTEGER,
  handle TEXT,
  overall INTEGER,
  finish TEXT,
  difficulty TEXT,
  showRatings TEXT
);
