import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = supabaseServer();

  // Check admin
  const { data: adminCheck } = await supabase
    .schema("cse")
    .rpc("current_user_is_admin");

  if (!adminCheck) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Fetch pending uploads
  const { data, error } = await supabase
    .schema("cse")
    .rpc("list_pending_storage_uploads");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const { object_id } = await req.json();

  // Check admin
  const { data: adminCheck } = await supabase
    .schema("cse")
    .rpc("current_user_is_admin");

  if (!adminCheck) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Approve file
  const { error } = await supabase
    .schema("cse")
    .rpc("approve_storage_object", { object_id });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
