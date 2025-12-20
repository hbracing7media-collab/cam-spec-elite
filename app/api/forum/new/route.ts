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

  const { title, body, tagged_awards } = await req.json();
  if (!title || !body) {
    return NextResponse.json({ ok: false, message: "Title and body required" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);

  if (userError || !user) {
    return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });
  }

  const { error, data } = await supabase
    .from("forum_threads")
    .insert([{ user_id: user.id, title, body }])
    .select();

  if (error) {
    console.error("Forum thread insert error:", error);
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }

  const thread = data?.[0];

  // Tag awards if provided
  if (thread && Array.isArray(tagged_awards) && tagged_awards.length > 0) {
    const awardTags = tagged_awards.map((award_id: string) => ({
      post_id: thread.id,
      user_award_id: award_id,
    }));

    const { error: tagError } = await supabase
      .from("forum_post_awards")
      .insert(awardTags);

    if (tagError) {
      console.error("Award tag error:", tagError);
      // Don't fail the thread, just log the error
    }
  }

  return NextResponse.json({ ok: true, message: "Thread created!", thread });
}