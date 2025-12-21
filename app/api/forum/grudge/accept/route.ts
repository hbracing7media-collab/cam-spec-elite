import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { match_id } = body;

    if (!match_id) {
      return Response.json(
        { ok: false, message: "Missing match_id" },
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

    // Verify user is the opponent
    if (match.opponent_id !== user.id) {
      return Response.json(
        { ok: false, message: "You are not the opponent in this match" },
        { status: 403 }
      );
    }

    // Update match status
    const { data: updatedMatch, error: updateError } = await db
      .from("grudge_matches")
      .update({
        status: "in_progress",
        updated_at: new Date().toISOString(),
      })
      .eq("id", match_id)
      .select()
      .single();

    if (updateError) {
      return Response.json(
        { ok: false, message: "Failed to accept challenge" },
        { status: 500 }
      );
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
