import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

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

  const { thread_id, body } = await req.json();
  if (!thread_id || !body) {
    return NextResponse.json({ ok: false, message: "Thread ID and body required" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);

  if (userError || !user) {
    return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });
  }

  const { error, data } = await supabase
    .from("forum_posts")
    .insert([{
      thread_id,
      user_id: user.id,
      body: body.trim()
    }])
    .select();

  if (error) {
    console.error("Forum post insert error:", error);
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Reply posted!", post: data?.[0] });
}
