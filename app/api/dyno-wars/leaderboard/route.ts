import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

export async function GET(req: Request) {
  try {
    // Fetch all dyno submissions (public + user's own private ones)
    const { data: submissions, error } = await supabaseAdmin
      .from("dyno_submissions")
      .select(
        `
        id,
        engine_name,
        user_id,
        horsepower,
        torque,
        engine_make,
        engine_family,
        visibility,
        status,
        created_at,
        spec
      `
      )
      .eq("status", "approved")
      .order("horsepower", { ascending: false });

    if (error) {
      return Response.json(
        { ok: false, message: "Failed to fetch submissions: " + error.message },
        { status: 500 }
      );
    }

    // Filter for public submissions only (privacy: show all approved dyno data)
    const entries = submissions
      .filter((submission: any) => submission.visibility === "public" && submission.status === "approved")
      .map((submission: any) => ({
        id: submission.id,
        engine_name: submission.engine_name,
        user_id: submission.user_id,
        horsepower: submission.horsepower,
        torque: submission.torque,
        engine_make: submission.engine_make,
        engine_family: submission.engine_family,
        created_at: submission.created_at,
        spec: submission.spec,
      }));

    return Response.json({ ok: true, entries });
  } catch (err: any) {
    console.error("Dyno Wars API error:", err);
    return Response.json(
      { ok: false, message: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
