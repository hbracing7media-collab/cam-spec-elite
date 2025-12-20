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

  // Parse multipart/form-data
  const formData = await req.formData();
  const forum_handle = formData.get("forum_handle") as string | null;
  const avatarFile = formData.get("forum_avatar") as File | null;

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);

  if (userError || !user) {
    return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });
  }

  let forum_avatar_url = "";

  // If a new avatar image is uploaded, store it
  if (avatarFile && avatarFile.size > 0) {
    try {
      const arrayBuffer = await avatarFile.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      // Use user id and timestamp for unique path
      const ext = avatarFile.name.split(".").pop() || "png";
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("forum_avatars")
        .upload(filePath, buffer, {
          contentType: avatarFile.type,
          upsert: true,
        });

      if (uploadError) {
        console.error("Avatar upload error:", uploadError);
        return NextResponse.json({ ok: false, message: `Avatar upload failed: ${uploadError.message}` }, { status: 400 });
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage.from("forum_avatars").getPublicUrl(filePath);
      forum_avatar_url = publicUrlData.publicUrl;
      console.log("Avatar uploaded successfully:", forum_avatar_url);
    } catch (err: any) {
      console.error("Avatar upload exception:", err);
      return NextResponse.json({ ok: false, message: `Avatar upload error: ${err.message}` }, { status: 400 });
    }
  }

  // Build update object - only update fields that have values
  const updateData: any = {
    id: user.id,
    updated_at: new Date().toISOString()
  };

  if (forum_handle !== null) {
    updateData.forum_handle = forum_handle;
  }

  if (forum_avatar_url) {
    updateData.forum_avatar_url = forum_avatar_url;
  }

  // Upsert user profile in the user_profiles table
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .upsert(updateData, {
      onConflict: "id"
    })
    .select()
    .single();

  if (profileError) {
    console.error("Profile update error:", profileError);
    return NextResponse.json({ ok: false, message: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ 
    ok: true, 
    message: "Profile updated!", 
    forum_avatar_url: profile?.forum_avatar_url || forum_avatar_url,
    forum_handle: profile?.forum_handle
  });
}