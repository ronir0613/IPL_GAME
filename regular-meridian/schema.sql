CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  handle TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS leaderboard (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
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
  showRatings TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
