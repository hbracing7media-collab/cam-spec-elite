import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// This route creates an attachment record after direct-to-Supabase upload
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
    const body = await req.json();
    const { thread_id, post_id, file_url, file_name, file_type } = body;

    if (!thread_id) {
      return NextResponse.json({ ok: false, message: "Missing thread_id" }, { status: 400 });
    }

    if (!file_url) {
      return NextResponse.json({ ok: false, message: "Missing file_url" }, { status: 400 });
    }

    // Create attachment record
    const { data: attachment, error: attachError } = await supabase
      .from("forum_attachments")
      .insert([{
        thread_id,
        post_id: post_id || null,
        user_id: user.id,
        file_url,
        file_name: file_name || "attachment",
        file_type: file_type || "application/octet-stream"
      }])
      .select()
      .single();

    if (attachError) {
      console.error("Attachment record error:", attachError);
      return NextResponse.json({ 
        ok: false, 
        message: `Error saving attachment: ${attachError.message}` 
      }, { status: 400 });
    }

    return NextResponse.json({ ok: true, attachment });
  } catch (err: any) {
    console.error("Attachment record API error:", err);
    return NextResponse.json({ ok: false, message: `Error: ${err.message}` }, { status: 500 });
  }
}
