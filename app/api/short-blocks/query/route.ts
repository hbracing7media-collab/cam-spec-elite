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
    const url = new URL(req.url);
    const make = url.searchParams.get("make");
    const family = url.searchParams.get("family");
    const displacement = url.searchParams.get("displacement");

    let query = supabase
      .from("user_short_blocks")
      .select("*")
      .eq("user_id", user.id);

    if (make) {
      query = query.ilike("engine_make", `%${make}%`);
    }

    if (family) {
      query = query.ilike("engine_family", `%${family}%`);
    }

    if (displacement) {
      query = query.ilike("displacement", `%${displacement}%`);
    }

    const { data: blocks, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching blocks:", error);
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, blocks });
  } catch (err: any) {
    console.error("Exception:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
