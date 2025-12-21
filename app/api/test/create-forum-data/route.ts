import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return Response.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
  }

  try {
    const db = createClient(supabaseUrl, supabaseServiceKey);

    // Create a test user
    const { data: authUser, error: authError } = await db.auth.admin.createUser({
      email: "test@hbracing7.local",
      password: "TestPassword123!",
      email_confirm: true,
      user_metadata: {
        display_name: "Test User",
      },
    });

    if (authError && !authError.message.includes("already exists")) {
      console.error("Auth error:", authError);
      return Response.json({ ok: false, message: authError.message }, { status: 500 });
    }

    // If user already exists, fetch it
    let userId = authUser?.user?.id;
    if (!userId) {
      const { data: existingUser } = await db
        .from("auth.users")
        .select("id")
        .eq("email", "test@hbracing7.local")
        .single();
      
      if (!existingUser) {
        return Response.json(
          { ok: false, message: "Could not create or find test user" },
          { status: 500 }
        );
      }
      userId = existingUser.id;
    }

    // Create or update user profile
    await db.from("user_profiles").upsert({
      user_id: userId,
      forum_handle: "test",
      forum_avatar_url: null,
    });

    // Create test thread
    const { data: thread, error: threadError } = await db
      .from("forum_threads")
      .insert({
        user_id: userId,
        title: "Test Thread - Hover over my avatar to challenge me! 🏎️",
        body: "This is a test thread created to test the hover-to-challenge feature. Try hovering over my avatar and sending me a grudge match challenge!",
      })
      .select()
      .single();

    if (threadError) {
      console.error("Thread error:", threadError);
      return Response.json(
        { ok: false, message: "Failed to create test thread", error: threadError.message },
        { status: 500 }
      );
    }

    // Create a test reply
    const { data: reply, error: replyError } = await db
      .from("forum_posts")
      .insert({
        thread_id: thread.id,
        user_id: userId,
        body: "This is a test reply! Challenge accepted! 🏁",
      })
      .select()
      .single();

    if (replyError) {
      console.error("Reply error:", replyError);
    }

    return Response.json({
      ok: true,
      message: "Test data created successfully",
      user: {
        id: userId,
        email: "test@hbracing7.local",
        handle: "test",
      },
      thread: {
        id: thread.id,
        title: thread.title,
        url: `/forum/thread/${thread.id}`,
      },
      reply: reply ? { id: reply.id } : null,
    });
  } catch (error) {
    console.error("Error:", error);
    return Response.json(
      { ok: false, message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    ok: true,
    message: "POST to this endpoint to create test forum data",
    credentials: {
      email: "test@hbracing7.local",
      password: "TestPassword123!",
    },
  });
}
