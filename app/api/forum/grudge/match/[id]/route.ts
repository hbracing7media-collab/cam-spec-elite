import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

interface TimeSlipData {
  reaction_time: number;
  sixty_foot: number;
  eighth_et: number;
  eighth_mph: number;
  quarter_et: number;
  quarter_mph: number;
}

interface RollSlipData {
  reaction_time: number;
  sixty_to_hundred: number;
  hundred_to_one_twenty: number;
  one_twenty_to_one_thirty: number;
  total_time: number;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: match_id } = await params;
    const body = await request.json();
    const { user_role, time_slip, roll_slip, match_type } = body as { 
      user_role: "challenger" | "opponent"; 
      time_slip?: TimeSlipData;
      roll_slip?: RollSlipData;
      match_type?: string;
    };

    const isRollRace = match_type === "roll-60-130" || roll_slip !== undefined;

    if (!user_role || (!time_slip && !roll_slip)) {
      return Response.json(
        { ok: false, message: "Missing user_role or time slip data" },
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

    // Verify user is participant and matches their role
    const isChallenger = user.id === match.challenger_id;
    const isOpponent = user.id === match.opponent_id;
    
    if (!isChallenger && !isOpponent) {
      return Response.json(
        { ok: false, message: "You are not part of this match" },
        { status: 403 }
      );
    }

    if ((user_role === "challenger" && !isChallenger) || (user_role === "opponent" && !isOpponent)) {
      return Response.json(
        { ok: false, message: "User role mismatch" },
        { status: 403 }
      );
    }

    // Build update based on which player is submitting
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (isRollRace && roll_slip) {
      // Roll race submission
      if (user_role === "challenger") {
        updateData.challenger_reaction_ms = Math.round(roll_slip.reaction_time * 1000);
        updateData.challenger_roll_sixty_to_hundred = roll_slip.sixty_to_hundred;
        updateData.challenger_roll_hundred_to_one_twenty = roll_slip.hundred_to_one_twenty;
        updateData.challenger_roll_one_twenty_to_one_thirty = roll_slip.one_twenty_to_one_thirty;
        updateData.challenger_roll_total = roll_slip.total_time;
      } else {
        updateData.opponent_reaction_ms = Math.round(roll_slip.reaction_time * 1000);
        updateData.opponent_roll_sixty_to_hundred = roll_slip.sixty_to_hundred;
        updateData.opponent_roll_hundred_to_one_twenty = roll_slip.hundred_to_one_twenty;
        updateData.opponent_roll_one_twenty_to_one_thirty = roll_slip.one_twenty_to_one_thirty;
        updateData.opponent_roll_total = roll_slip.total_time;
      }
    } else if (time_slip) {
      // Standard drag race submission
      if (user_role === "challenger") {
        updateData.challenger_reaction_ms = Math.round(time_slip.reaction_time * 1000);
        updateData.challenger_sixty_ft = time_slip.sixty_foot;
        updateData.challenger_eighth_et = time_slip.eighth_et;
        updateData.challenger_eighth_mph = time_slip.eighth_mph;
        updateData.challenger_quarter_et = time_slip.quarter_et;
        updateData.challenger_quarter_mph = time_slip.quarter_mph;
        updateData.challenger_time_ms = Math.round(time_slip.quarter_et * 1000);
      } else {
        updateData.opponent_reaction_ms = Math.round(time_slip.reaction_time * 1000);
        updateData.opponent_sixty_ft = time_slip.sixty_foot;
        updateData.opponent_eighth_et = time_slip.eighth_et;
        updateData.opponent_eighth_mph = time_slip.eighth_mph;
        updateData.opponent_quarter_et = time_slip.quarter_et;
        updateData.opponent_quarter_mph = time_slip.quarter_mph;
        updateData.opponent_time_ms = Math.round(time_slip.quarter_et * 1000);
      }
    }

    // Check if opponent has already submitted - check the appropriate field based on race type
    const otherPlayerSubmitted = isRollRace
      ? (user_role === "challenger" ? match.opponent_roll_total !== null : match.challenger_roll_total !== null)
      : (user_role === "challenger" ? match.opponent_reaction_ms !== null : match.challenger_reaction_ms !== null);

    console.log("Grudge match submission:", {
      user_role,
      match_status: match.status,
      isRollRace,
      challenger_reaction_ms: match.challenger_reaction_ms,
      opponent_reaction_ms: match.opponent_reaction_ms,
      otherPlayerSubmitted,
    });

    if (otherPlayerSubmitted) {
      // Both players done - determine winner and complete match
      let challengerTime: number;
      let opponentTime: number;

      if (isRollRace && roll_slip) {
        // For roll race, compare total 60-130 times (lower is better)
        challengerTime = user_role === "challenger" 
          ? roll_slip.total_time 
          : match.challenger_roll_total;
        opponentTime = user_role === "opponent" 
          ? roll_slip.total_time 
          : match.opponent_roll_total;
      } else if (time_slip) {
        // For drag race, compare reaction times (lower is better)
        challengerTime = user_role === "challenger" 
          ? time_slip.reaction_time * 1000 
          : match.challenger_reaction_ms;
        opponentTime = user_role === "opponent" 
          ? time_slip.reaction_time * 1000 
          : match.opponent_reaction_ms;
      } else {
        challengerTime = 0;
        opponentTime = 0;
      }

      console.log("Both players done - determining winner:", { challengerTime, opponentTime });

      updateData.status = "completed";
      updateData.winner_id = challengerTime < opponentTime ? match.challenger_id : match.opponent_id;
      updateData.completed_at = new Date().toISOString();
    } else {
      // First player done - waiting for opponent
      console.log("First player done - waiting for opponent");
      updateData.status = "waiting_opponent";
    }

    // Update match
    const { data: updatedMatch, error: updateError } = await db
      .from("grudge_matches")
      .update(updateData)
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

    // Update stats if match is completed
    if (updatedMatch.status === "completed") {
      await updateUserStats(db, match.challenger_id, updatedMatch.winner_id === match.challenger_id, updatedMatch.challenger_reaction_ms);
      await updateUserStats(db, match.opponent_id, updatedMatch.winner_id === match.opponent_id, updatedMatch.opponent_reaction_ms);
    }

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
