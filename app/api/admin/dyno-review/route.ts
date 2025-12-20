import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const access_token = cookieStore.get("sb-access-token")?.value;

    if (!access_token) {
      return Response.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user has admin access (optional - can add more checks later)
    const { data: authData } = await supabaseAdmin.auth.getUser(access_token);
    if (!authData.user?.id) {
      return Response.json(
        { ok: false, message: "Invalid auth" },
        { status: 401 }
      );
    }

    const { submissionId, action } = await req.json();

    if (!submissionId || !action) {
      return Response.json(
        { ok: false, message: "Missing submissionId or action" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      const { data, error } = await supabaseAdmin
        .from("dyno_submissions")
        .update({ status: "approved" })
        .eq("id", submissionId)
        .select();

      if (error) {
        return Response.json(
          { ok: false, message: "Failed to approve: " + error.message },
          { status: 500 }
        );
      }

      return Response.json({
        ok: true,
        message: "Submission approved!",
        data,
      });
    } else if (action === "reject") {
      const { data, error } = await supabaseAdmin
        .from("dyno_submissions")
        .update({ status: "rejected" })
        .eq("id", submissionId)
        .select();

      if (error) {
        return Response.json(
          { ok: false, message: "Failed to reject: " + error.message },
          { status: 500 }
        );
      }

      return Response.json({
        ok: true,
        message: "Submission rejected!",
        data,
      });
    } else {
      return Response.json(
        { ok: false, message: "Invalid action" },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error("Admin review error:", err);
    return Response.json(
      { ok: false, message: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
