import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { opponent_id, match_type, challenger_dyno_id, opponent_dyno_id, thread_id } = body;

    if (!opponent_id || !match_type) {
      return Response.json(
        { ok: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["simple", "pro", "roll-60-130"].includes(match_type)) {
      return Response.json(
        { ok: false, message: "Invalid match_type" },
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
    const authClient = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);

    if (userError || !user) {
      return Response.json({ ok: false, message: "Invalid token" }, { status: 401 });
    }

    const challenger_id = user.id;

    // Verify opponent exists in user_profiles table
    const { data: opponent, error: opponentError } = await authClient
      .from("user_profiles")
      .select("id")
      .eq("id", opponent_id)
      .single();

    if (opponentError || !opponent) {
      console.error("Opponent lookup error:", opponentError, "opponent_id:", opponent_id);
      return Response.json({ ok: false, message: "Opponent not found" }, { status: 404 });
    }

    // Generate stats for simple mode and roll race
    let challenger_weight_lbs = null;
    let challenger_hp = null;
    let opponent_weight_lbs = null;
    let opponent_hp = null;

    if (match_type === "simple" || match_type === "roll-60-130") {
      // Both vehicles get the same specs for a fair race (winner determined by reaction time)
      const weight = Math.floor(Math.random() * (4500 - 2500) + 2500);
      const hp = Math.floor(Math.random() * (700 - 300) + 300);
      challenger_weight_lbs = weight;
      challenger_hp = hp;
      opponent_weight_lbs = weight;
      opponent_hp = hp;
    }

    // Use service role client with proper options to bypass RLS
    const db = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

    // Create the match
    const { data: match, error: createError } = await db
      .from("grudge_matches")
      .insert({
        challenger_id,
        opponent_id,
        match_type,
        challenger_weight_lbs,
        challenger_hp,
        opponent_weight_lbs,
        opponent_hp,
        challenger_dyno_id: match_type === "pro" ? challenger_dyno_id : null,
        opponent_dyno_id: match_type === "pro" ? opponent_dyno_id : null,
        thread_id: thread_id || null,
        status: "pending",
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating match:", createError);
      console.error("Insert payload:", {
        challenger_id,
        opponent_id,
        match_type,
        challenger_weight_lbs,
        challenger_hp,
        opponent_weight_lbs,
        opponent_hp,
        status: "pending",
      });
      return Response.json(
        { ok: false, message: `Failed to create match: ${createError.message}`, error: createError.message, code: createError.code },
        { status: 500 }
      );
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

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return Response.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
    }

    const db = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return Response.json(
        { ok: false, message: "Missing user_id parameter" },
        { status: 400 }
      );
    }

    // Get pending challenges for user
    const { data: pendingChallenges, error: pendingError } = await db
      .from("grudge_matches")
      .select("*")
      .eq("opponent_id", user_id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    // Get user's active matches (accepted, in_progress, waiting_opponent)
    const { data: activeMatches, error: activeError } = await db
      .from("grudge_matches")
      .select("*")
      .or(`challenger_id.eq.${user_id},opponent_id.eq.${user_id}`)
      .in("status", ["accepted", "in_progress", "waiting_opponent"])
      .order("created_at", { ascending: false });

    // Get user's completed matches
    const { data: completedMatches, error: completedError } = await db
      .from("grudge_matches")
      .select("*")
      .or(`challenger_id.eq.${user_id},opponent_id.eq.${user_id}`)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(20);

    if (pendingError || activeError || completedError) {
      return Response.json(
        { ok: false, message: "Failed to fetch matches" },
        { status: 500 }
      );
    }

    // Combine active and completed for the activeMatches response
    const allMatches = [...(activeMatches || []), ...(completedMatches || [])];

    // Fetch profiles for all unique user IDs
    const userIds = new Set<string>();
    [...(pendingChallenges || []), ...allMatches].forEach((m) => {
      if (m.challenger_id) userIds.add(m.challenger_id);
      if (m.opponent_id) userIds.add(m.opponent_id);
      if (m.winner_id) userIds.add(m.winner_id);
    });

    const { data: profiles } = await db
      .from("user_profiles")
      .select("id, forum_handle, forum_avatar_url")
      .in("id", Array.from(userIds));

    const profileMap: Record<string, { forum_handle: string; forum_avatar_url: string | null }> = {};
    (profiles || []).forEach((p) => {
      profileMap[p.id] = { forum_handle: p.forum_handle, forum_avatar_url: p.forum_avatar_url };
    });

    // Attach profiles to matches
    const attachProfiles = (matches: any[]) =>
      matches.map((m) => ({
        ...m,
        challenger_profile: profileMap[m.challenger_id] || null,
        opponent_profile: profileMap[m.opponent_id] || null,
        winner_profile: m.winner_id ? profileMap[m.winner_id] || null : null,
      }));

    return Response.json({
      ok: true,
      pendingChallenges: attachProfiles(pendingChallenges || []),
      activeMatches: attachProfiles(allMatches),
    });
  } catch (error) {
    console.error("Error:", error);
    return Response.json(
      { ok: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
