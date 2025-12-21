import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: match_id } = await params;
    const body = await request.json();
    const { challenger_reaction_ms, opponent_reaction_ms, challenger_time_ms, opponent_time_ms } =
      body;

    if (
      typeof challenger_reaction_ms !== "number" ||
      typeof opponent_reaction_ms !== "number"
    ) {
      return Response.json(
        { ok: false, message: "Missing or invalid reaction times" },
        { status: 400 }
      );
    }

    // Get session from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("sb-access-token")?.value;

    if (!token) {
      return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return Response.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
    }

    // Get user from token
    const authClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);

    if (userError || !user) {
      return Response.json({ ok: false, message: "Invalid token" }, { status: 401 });
    }

    const db = createClient(supabaseUrl, supabaseServiceKey);

    // Get match
    const { data: match, error: fetchError } = await db
      .from("grudge_matches")
      .select("*")
      .eq("id", match_id)
      .single();

    if (fetchError || !match) {
      return Response.json({ ok: false, message: "Match not found" }, { status: 404 });
    }

    // Verify user is participant
    if (user.id !== match.challenger_id && user.id !== match.opponent_id) {
      return Response.json(
        { ok: false, message: "You are not part of this match" },
        { status: 403 }
      );
    }

    // Determine winner based on reaction time (faster wins)
    const winner_id =
      challenger_reaction_ms < opponent_reaction_ms ? match.challenger_id : match.opponent_id;

    // Update match with results
    const { data: updatedMatch, error: updateError } = await db
      .from("grudge_matches")
      .update({
        status: "completed",
        challenger_reaction_ms,
        opponent_reaction_ms,
        challenger_time_ms,
        opponent_time_ms,
        winner_id,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", match_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating match:", updateError);
      return Response.json(
        { ok: false, message: "Failed to record match results" },
        { status: 500 }
      );
    }

    // Update stats for both users
    await updateUserStats(db, match.challenger_id, winner_id === match.challenger_id, challenger_reaction_ms);
    await updateUserStats(db, match.opponent_id, winner_id === match.opponent_id, opponent_reaction_ms);

    return Response.json({ ok: true, match: updatedMatch });
  } catch (error) {
    console.error("Error:", error);
    return Response.json(
      { ok: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

async function updateUserStats(db: any, user_id: string, won: boolean, reaction_ms: number) {
  // Get or create stats
  const { data: existingStats } = await db
    .from("grudge_match_stats")
    .select("*")
    .eq("user_id", user_id)
    .single();

  if (!existingStats) {
    await db.from("grudge_match_stats").insert({
      user_id,
      total_matches: 1,
      wins: won ? 1 : 0,
      losses: won ? 0 : 1,
      best_reaction_ms: reaction_ms,
      avg_reaction_ms: reaction_ms,
    });
  } else {
    const new_total = existingStats.total_matches + 1;
    const new_wins = existingStats.wins + (won ? 1 : 0);
    const new_losses = existingStats.losses + (won ? 0 : 1);
    const new_avg =
      ((existingStats.avg_reaction_ms || 0) * existingStats.total_matches + reaction_ms) /
      new_total;
    const new_best = Math.min(
      existingStats.best_reaction_ms || reaction_ms,
      reaction_ms
    );

    await db
      .from("grudge_match_stats")
      .update({
        total_matches: new_total,
        wins: new_wins,
        losses: new_losses,
        avg_reaction_ms: new_avg,
        best_reaction_ms: new_best,
        win_streak: won ? (existingStats.win_streak || 0) + 1 : 0,
      })
      .eq("user_id", user_id);
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: match_id } = await params;
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return Response.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
    }

    const db = createClient(supabaseUrl, supabaseServiceKey);

    const { data: match, error } = await db
      .from("grudge_matches")
      .select("*")
      .eq("id", match_id)
      .single();

    if (error || !match) {
      return Response.json({ ok: false, message: "Match not found" }, { status: 404 });
    }

    return Response.json({ ok: true, match });
  } catch (error) {
    console.error("Error:", error);
    return Response.json(
      { ok: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
