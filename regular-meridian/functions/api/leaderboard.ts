/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  AI: any;
}

const ADJECTIVES = [
"Royal", "Golden", "Crimson", "Shadow", "Storm", "Thunder", "Iron", "Silent", "Rapid", "Mighty",
"Fearless", "Brave", "Legendary", "Swift", "Wild", "Fierce", "Night", "Fire", "Epic", "Elite",
"Dark", "Bright", "Flying", "Electric", "Frozen", "Burning", "Deadly", "Hidden", "Ancient", "Young",
"Grand", "Supreme", "Alpha", "Prime", "Ultimate", "Savage", "Dangerous", "Bold", "Sharp", "Quick",
"Massive", "Tiny", "Heavy", "Agile", "Stealthy", "Raging", "Vicious", "Crazy", "Mad", "Ruthless",
"Merciless", "Glorious", "Invincible", "Dominant", "Heroic", "Fearsome", "Powerful", "Mystic",
"Phantom", "Cosmic", "Solar", "Lunar", "Stellar", "Atomic", "Turbo", "Turbocharged", "Dynamic",
"Relentless", "Furious", "Colossal", "Majestic", "Noble", "Imperial", "Scarlet", "Emerald",
"Diamond", "Platinum", "Silver", "Bronze", "Steel", "Titan", "Dragon", "Wolf", "Falcon", "Hawk",
"Phoenix", "Venom", "Ghost", "Rebel", "Victory", "Champion", "Warrior", "Spartan", "Samurai",
"Gladiator", "Monarch", "King", "Emperor", "Empress", "Overlord", "Master"
];

const CRICKET_TERMS = [
"Yorker", "Googly", "Doosra", "Bouncer", "Spinner", "Finisher", "Captain", "Keeper", "Slogger",
"Chaser", "Striker", "Batter", "Bowler", "Opener", "AllRounder", "Pacer", "Swinger", "Seamer",
"Fielder", "Legend", "Champion", "Warrior", "Titan", "King", "Emperor", "Destroyer", "Hunter",
"Predator", "Master", "Wizard", "Magician", "Artist", "Sniper", "Blaster", "Crusher", "Dominator",
"Conqueror", "Gladiator", "Guardian", "Invader", "Raider", "Protector", "Knight", "Ruler",
"Commander", "General", "Marshal", "Ace", "Hero", "Superstar", "RunMachine", "WicketHunter",
"BoundaryKing", "PowerHitter", "Anchorman", "MatchWinner", "FinisherKing", "DeathBowler",
"SpinWizard", "PaceKing", "RunScorer", "SixHitter", "ChaseMaster", "PowerplayKing", "CaptainCool",
"Hitman", "Wall", "Sultan", "UniverseBoss", "Kingmaker", "GameChanger", "Troubleshooter",
"RunGetter", "StrikeMaker", "YorkerKing", "SwingMaster", "FastBowler", "MiddleOrder", "TopOrder",
"LowerOrder", "Closer", "SuperOver", "GoToGuy", "Nightwatchman", "ImpactPlayer", "FieldMaster",
"BoundaryRider", "Catcher", "ShotMaker", "ShotCaller", "BigHitter", "Firestarter", "RunChaser",
"VictoryMaker", "GameWinner", "ChampionMaker", "RecordBreaker"
];

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = 50;
    const offset = (page - 1) * limit;

    const { results } = await context.env.DB.prepare(`
      SELECT l.*, u.handle as username,
             RANK() OVER (ORDER BY l.champion DESC, l.wins DESC, l.nrr DESC) as rank
      FROM leaderboard l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY rank ASC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    return Response.json(results);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const data = await context.request.json() as any;
    
    // Always generate a random handle for the submission
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    let submissionHandle = "";
    
    while (!isUnique && attempts < maxAttempts) {
      const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
      const term = CRICKET_TERMS[Math.floor(Math.random() * CRICKET_TERMS.length)];
      const num = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      submissionHandle = `${adj}${term}${num}`;
      
      const { results } = await context.env.DB.prepare('SELECT id FROM leaderboard WHERE handle = ? LIMIT 1').bind(submissionHandle).all();
      if (results.length === 0) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      // Fallback just in case of extreme bad luck
      submissionHandle = `Player${Math.floor(Math.random() * 1000000)}`;
    }

    if (!data.userId) {
      return Response.json({ error: "Missing user ID (userId)" }, { status: 400 });
    }
    if (!data.id) {
      return Response.json({ error: "Missing run ID (id)" }, { status: 400 });
    }

    // The user's permanent handle (if they don't have one, this becomes their permanent one too)
    const permanentHandle = data.handle || submissionHandle;
    
    // Ensure the user exists in the users table
    let userHandle = permanentHandle;
    const userCheck = await context.env.DB.prepare('SELECT id, handle FROM users WHERE id = ?').bind(data.userId).first<any>();
    if (!userCheck) {
      // If the handle is already taken, append a random suffix to make it unique
      let handleUnique = false;
      let suffixAttempts = 0;
      while (!handleUnique && suffixAttempts < 10) {
        const existingUser = await context.env.DB.prepare('SELECT id FROM users WHERE handle = ?').bind(userHandle).first();
        if (!existingUser) {
          handleUnique = true;
        } else {
          userHandle = `${permanentHandle}${Math.floor(Math.random() * 100)}`;
          suffixAttempts++;
        }
      }
      if (!handleUnique) {
        userHandle = `${permanentHandle}${Math.floor(Math.random() * 10000)}`;
      }
      
      await context.env.DB.prepare(`
        INSERT INTO users (id, handle) VALUES (?1, ?2)
      `).bind(data.userId, userHandle).run();
    } else {
      userHandle = userCheck.handle;
    }

    await context.env.DB.prepare(`
      INSERT INTO leaderboard (id, user_id, date, mode, wins, losses, points, nrr, position, champion, handle, overall, finish, difficulty, showRatings) 
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
    `).bind(
      data.id, 
      data.userId,
      data.date, 
      data.mode, 
      data.wins, 
      data.losses, 
      data.points, 
      data.nrr, 
      data.position, 
      data.champion ? 1 : 0, 
      submissionHandle, 
      data.overall, 
      data.finish, 
      data.difficulty, 
      data.showRatings
    ).run();

    // After inserting, we can query to find the user's specific rank!
    const { results } = await context.env.DB.prepare(`
      SELECT rank FROM (
        SELECT id, RANK() OVER (ORDER BY champion DESC, wins DESC, nrr DESC) as rank
        FROM leaderboard
      ) WHERE id = ?
    `).bind(data.id).all();

    const rank = results.length > 0 ? results[0].rank : null;

    return Response.json({ success: true, rank, handle: userHandle });
  } catch (e: any) {
    console.error("Leaderboard submission error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
};
