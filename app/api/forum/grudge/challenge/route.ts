import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { opponent_id, match_type, challenger_dyno_id, opponent_dyno_id } = body;

    if (!opponent_id || !match_type) {
      return Response.json(
        { ok: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["simple", "pro"].includes(match_type)) {
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
    const authClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);

    if (userError || !user) {
      return Response.json({ ok: false, message: "Invalid token" }, { status: 401 });
    }

    const challenger_id = user.id;

    // Verify opponent exists
    const { data: opponent, error: opponentError } = await authClient
      .from("auth.users")
      .select("id")
      .eq("id", opponent_id)
      .single();

    if (opponentError || !opponent) {
      return Response.json({ ok: false, message: "Opponent not found" }, { status: 404 });
    }

    // Generate stats for simple mode
    let challenger_weight_lbs = null;
    let challenger_hp = null;
    let opponent_weight_lbs = null;
    let opponent_hp = null;

    if (match_type === "simple") {
      challenger_weight_lbs = Math.floor(Math.random() * (4500 - 2500) + 2500);
      challenger_hp = Math.floor(Math.random() * (700 - 300) + 300);
      opponent_weight_lbs = Math.floor(Math.random() * (4500 - 2500) + 2500);
      opponent_hp = Math.floor(Math.random() * (700 - 300) + 300);
    }

    const db = createClient(supabaseUrl, supabaseServiceKey);

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
        status: "pending",
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating match:", createError);
      return Response.json(
        { ok: false, message: "Failed to create match", error: createError.message },
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

    // Get user's active matches
    const { data: activeMatches, error: activeError } = await db
      .from("grudge_matches")
      .select("*")
      .or(`challenger_id.eq.${user_id},opponent_id.eq.${user_id}`)
      .neq("status", "completed")
      .order("created_at", { ascending: false });

    if (pendingError || activeError) {
      return Response.json(
        { ok: false, message: "Failed to fetch matches" },
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      pendingChallenges: pendingChallenges || [],
      activeMatches: activeMatches || [],
    });
  } catch (error) {
    console.error("Error:", error);
    return Response.json(
      { ok: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
