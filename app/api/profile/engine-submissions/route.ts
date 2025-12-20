import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cookieStore = await cookies();

  if (!supabaseUrl || !serviceRole) {
    return NextResponse.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
  }

  const access_token = cookieStore.get("sb-access-token")?.value;
  if (!access_token) {
    return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);

  if (userError || !user) {
    return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });
  }

  try {
    const { data: submissions, error } = await supabase
      .from("user_engine_submissions")
      .select("*, user_short_blocks(*), cylinder_heads(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching engine submissions:", error);
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, submissions });
  } catch (err: any) {
    console.error("Exception:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cookieStore = await cookies();

  if (!supabaseUrl || !serviceRole) {
    return NextResponse.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
  }

  const access_token = cookieStore.get("sb-access-token")?.value;
  if (!access_token) {
    return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);

  if (userError || !user) {
    return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const engine_name = formData.get("engine_name") as string;
    const short_block_id = formData.get("short_block_id") as string;
    const head_id = formData.get("head_id") as string | null;
    const cam_ids = formData.get("cam_ids") as string | null;
    const description = formData.get("description") as string | null;
    const notes = formData.get("notes") as string | null;
    const dyno_sheet_file = formData.get("dyno_sheet") as File;
    const cam_card_file = formData.get("cam_card") as File;

    if (!engine_name || !short_block_id || !dyno_sheet_file) {
      return NextResponse.json(
        { ok: false, message: "Engine name, short block, and dyno sheet are required" },
        { status: 400 }
      );
    }

    // Create unique file paths
    const submission_id = crypto.randomUUID();
    const dyno_ext = dyno_sheet_file.name.split(".").pop() || "pdf";
    const dyno_path = `${user.id}/${submission_id}/dyno_sheet.${dyno_ext}`;

    let cam_card_path: string | null = null;
    if (cam_card_file) {
      const cam_ext = cam_card_file.name.split(".").pop() || "jpg";
      cam_card_path = `${user.id}/${submission_id}/cam_card.${cam_ext}`;
    }

    // Upload dyno sheet
    const dyno_buffer = await dyno_sheet_file.arrayBuffer();
    const dyno_upload = await supabase.storage
      .from("engine_dyno_sheets")
      .upload(dyno_path, Buffer.from(dyno_buffer), { upsert: true });

    if (dyno_upload.error) {
      console.error("Error uploading dyno sheet:", dyno_upload.error);
      return NextResponse.json(
        { ok: false, message: "Failed to upload dyno sheet" },
        { status: 400 }
      );
    }

    // Upload cam card if provided
    if (cam_card_file && cam_card_path) {
      const cam_buffer = await cam_card_file.arrayBuffer();
      const cam_upload = await supabase.storage
        .from("engine_cam_cards")
        .upload(cam_card_path, Buffer.from(cam_buffer), { upsert: true });

      if (cam_upload.error) {
        console.error("Error uploading cam card:", cam_upload.error);
        return NextResponse.json(
          { ok: false, message: "Failed to upload cam card" },
          { status: 400 }
        );
      }
    }

    // Parse cam_ids
    let cam_ids_array = null;
    if (cam_ids) {
      try {
        cam_ids_array = JSON.parse(cam_ids);
      } catch (e) {
        console.error("Error parsing cam_ids:", e);
      }
    }

    // Create submission record
    const { data: submission, error } = await supabase
      .from("user_engine_submissions")
      .insert({
        user_id: user.id,
        engine_name,
        short_block_id,
        head_id: head_id || null,
        cam_ids: cam_ids_array,
        description,
        dyno_sheet_path: dyno_path,
        cam_card_path,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating submission:", error);
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, submission });
  } catch (err: any) {
    console.error("Exception:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
