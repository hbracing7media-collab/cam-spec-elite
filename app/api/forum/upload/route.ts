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

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);

  if (userError || !user) {
    return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const threadId = formData.get("thread_id") as string;
    const postId = formData.get("post_id") as string | null;

    if (!file) {
      return NextResponse.json({ ok: false, message: "No file provided" }, { status: 400 });
    }

    if (!threadId) {
      return NextResponse.json({ ok: false, message: "Missing thread_id" }, { status: 400 });
    }

    console.log("Uploading file:", file.name, "size:", file.size, "type:", file.type);

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Upload to storage
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const filePath = `forum/${threadId}/${fileName}`;

    console.log("Uploading to path:", filePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("forum_attachments")
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ 
        ok: false, 
        message: `Upload failed: ${uploadError.message}` 
      }, { status: 400 });
    }

    console.log("Upload successful, path:", uploadData.path);

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from("forum_attachments")
      .getPublicUrl(filePath);

    console.log("Public URL:", publicUrl.publicUrl);

    // Create attachment record
    const { data: attachment, error: attachError } = await supabase
      .from("forum_attachments")
      .insert([{
        thread_id: threadId,
        post_id: postId || null,
        user_id: user.id,
        file_url: publicUrl.publicUrl,
        file_name: file.name,
        file_type: file.type
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

    console.log("Attachment record created:", attachment.id);

    return NextResponse.json({ ok: true, attachment });
  } catch (err: any) {
    console.error("Upload API error:", err);
    return NextResponse.json({ ok: false, message: `Error: ${err.message}` }, { status: 500 });
  }
}
