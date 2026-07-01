/// <reference types="@cloudflare/workers-types" />
import Filter from 'bad-words';

export interface Env {
  DB: D1Database;
  AI: any;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = 50;
    const offset = (page - 1) * limit;

    const { results } = await context.env.DB.prepare(`
      SELECT *, 
             RANK() OVER (ORDER BY champion DESC, wins DESC, nrr DESC) as rank
      FROM leaderboard
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
    
    if (data.handle) {
      // 1. Basic Profanity Filter (fast, catches common English bad words)
      try {
        const filter = new Filter();
        if (filter.isProfane(data.handle)) {
          return Response.json({ error: "Inappropriate name detected." }, { status: 400 });
        }
      } catch (e) {
        console.error("Filter error:", e);
      }

      // 2. AI Moderation (for multilingual, political, complex hate)
      try {
        if (context.env.AI) {
          const prompt = `Analyze the following display name: "${data.handle}". Is it inappropriate, political, discriminative, offensive, or hateful in any language? Answer strictly with YES or NO.`;
          const aiResponse = await context.env.AI.run('@cf/meta/llama-3-8b-instruct', {
            messages: [{ role: 'user', content: prompt }]
          });
          const answer = (aiResponse.response || "").trim().toUpperCase();
          if (answer.includes("YES") || answer.startsWith("YES")) {
            return Response.json({ error: "Inappropriate name detected." }, { status: 400 });
          }
        }
      } catch (err) {
        console.error("AI moderation error:", err);
        // Proceed if AI fails, rather than blocking the user
      }
    }
    
    await context.env.DB.prepare(`
      INSERT INTO leaderboard (id, date, mode, wins, losses, points, nrr, position, champion, handle, overall, finish, difficulty, showRatings) 
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
    `).bind(
      data.id, 
      data.date, 
      data.mode, 
      data.wins, 
      data.losses, 
      data.points, 
      data.nrr, 
      data.position, 
      data.champion ? 1 : 0, 
      data.handle, 
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

    return Response.json({ success: true, rank });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
