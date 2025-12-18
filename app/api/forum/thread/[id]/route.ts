import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: threadId } = await params;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    return NextResponse.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
  }

  if (!threadId) {
    return NextResponse.json({ ok: false, message: "Missing thread id" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  try {
    // Fetch thread
    const { data: thread, error: threadError } = await supabase
      .from("forum_threads")
      .select("id,title,body,created_at,user_id")
      .eq("id", threadId)
      .single();

    if (threadError) {
      console.error("Thread error:", threadError);
      return NextResponse.json({ ok: false, message: "Thread not found" }, { status: 404 });
    }

    // Fetch author profile if it exists
    let threadWithProfile = { ...thread, user_profiles: null };
    if (thread.user_id) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("forum_handle,forum_avatar_url")
        .eq("id", thread.user_id)
        .single();
      if (profile) {
        threadWithProfile.user_profiles = profile;
      }
    }

    // Fetch posts
    const { data: posts, error: postsError } = await supabase
      .from("forum_posts")
      .select("id,thread_id,user_id,body,created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (postsError) {
      console.error("Posts fetch error:", postsError);
      return NextResponse.json({ ok: false, message: "Error loading posts" }, { status: 400 });
    }

    // Fetch profiles for all post authors
    const postsWithProfiles = await Promise.all(
      (posts || []).map(async (post) => {
        let postWithProfile = { ...post, user_profiles: null };
        if (post.user_id) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("forum_handle,forum_avatar_url")
            .eq("id", post.user_id)
            .single();
          if (profile) {
            postWithProfile.user_profiles = profile;
          }
        }
        return postWithProfile;
      })
    );

    // Fetch attachments
    const { data: attachments, error: attachmentsError } = await supabase
      .from("forum_attachments")
      .select("id,thread_id,post_id,user_id,file_url,file_name,file_type,created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (attachmentsError) {
      console.error("Attachments fetch error:", attachmentsError);
      // Don't fail if attachments can't be loaded
    }

    return NextResponse.json({
      ok: true,
      thread: threadWithProfile,
      posts: postsWithProfiles,
      attachments: attachments || []
    });
  } catch (err: any) {
    console.error("Thread API error:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
