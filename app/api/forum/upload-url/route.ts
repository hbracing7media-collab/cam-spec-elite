import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// Generate a signed URL for client-side uploads
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
    const { thread_id, post_id, file_name, file_type } = body;

    if (!thread_id) {
      return NextResponse.json({ ok: false, message: "Missing thread_id" }, { status: 400 });
    }

    if (!file_name) {
      return NextResponse.json({ ok: false, message: "Missing file_name" }, { status: 400 });
    }

    // Validate file type
    const isImage = file_type?.startsWith("image/");
    const isVideo = file_type?.startsWith("video/");
    
    if (!isImage && !isVideo) {
      return NextResponse.json({ 
        ok: false, 
        message: "Only image and video files are allowed" 
      }, { status: 400 });
    }

    // Generate unique file path
    const safeFileName = `${Date.now()}-${file_name.replace(/\s+/g, "_")}`;
    const filePath = `forum/${thread_id}/${safeFileName}`;

    // Create a signed upload URL (valid for 60 seconds)
    const { data: signedUrl, error: signError } = await supabase.storage
      .from("forum_attachments")
      .createSignedUploadUrl(filePath);

    if (signError) {
      console.error("Signed URL error:", signError);
      return NextResponse.json({ 
        ok: false, 
        message: `Failed to create upload URL: ${signError.message}` 
      }, { status: 400 });
    }

    // Get the public URL for after upload
    const { data: publicUrlData } = supabase.storage
      .from("forum_attachments")
      .getPublicUrl(filePath);

    return NextResponse.json({ 
      ok: true, 
      signedUrl: signedUrl.signedUrl,
      token: signedUrl.token,
      path: filePath,
      publicUrl: publicUrlData.publicUrl,
      userId: user.id
    });
  } catch (err: any) {
    console.error("Signed URL API error:", err);
    return NextResponse.json({ ok: false, message: `Error: ${err.message}` }, { status: 500 });
  }
}
