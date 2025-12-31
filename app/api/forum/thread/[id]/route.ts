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

    // Fetch grudge matches for this thread
    const { data: grudgeMatches, error: grudgeError } = await supabase
      .from("grudge_matches")
      .select("id,challenger_id,opponent_id,status,winner_id,challenger_reaction_ms,opponent_reaction_ms,challenger_quarter_et,challenger_quarter_mph,opponent_quarter_et,opponent_quarter_mph,created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: false });

    if (grudgeError) {
      console.error("Grudge matches fetch error:", grudgeError);
      // Don't fail if grudge matches can't be loaded
    }

    // Fetch profiles for grudge match participants
    const grudgeMatchesWithProfiles = await Promise.all(
      (grudgeMatches || []).map(async (match) => {
        let matchWithProfiles: any = { ...match, challenger_profile: null, opponent_profile: null, winner_profile: null };
        
        if (match.challenger_id) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("forum_handle")
            .eq("id", match.challenger_id)
            .single();
          if (profile) matchWithProfiles.challenger_profile = profile;
        }
        
        if (match.opponent_id) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("forum_handle")
            .eq("id", match.opponent_id)
            .single();
          if (profile) matchWithProfiles.opponent_profile = profile;
        }
        
        if (match.winner_id) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("forum_handle")
            .eq("id", match.winner_id)
            .single();
          if (profile) matchWithProfiles.winner_profile = profile;
        }
        
        return matchWithProfiles;
      })
    );

    return NextResponse.json({
      ok: true,
      thread: threadWithProfile,
      posts: postsWithProfiles,
      attachments: attachments || [],
      grudgeMatches: grudgeMatchesWithProfiles
    });
  } catch (err: any) {
    console.error("Thread API error:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
