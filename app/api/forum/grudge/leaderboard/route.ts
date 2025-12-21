import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return Response.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
    }

    const db = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sortBy") || "elo_rating";

    // Get top players
    const { data: stats, error } = await db
      .from("grudge_match_stats")
      .select("*")
      .order(sortBy, { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching leaderboard:", error);
      return Response.json(
        { ok: false, message: "Failed to fetch leaderboard" },
        { status: 500 }
      );
    }

    return Response.json({ ok: true, leaderboard: stats || [] });
  } catch (error) {
    console.error("Error:", error);
    return Response.json(
      { ok: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
