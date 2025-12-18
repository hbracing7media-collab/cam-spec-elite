import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();

  // Check admin
  const { data: isAdmin, error: adminErr } = await supabase
    .schema("cse")
    .rpc("current_user_is_admin");

  if (adminErr) {
    return NextResponse.json({ error: adminErr.message }, { status: 500 });
  }
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Fetch pending uploads
  const { data, error } = await supabase
    .schema("cse")
    .rpc("list_pending_storage_uploads");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

type ApproveBody = { object_id: string };

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const object_id =
    typeof body === "object" && body !== null && "object_id" in body
      ? (body as ApproveBody).object_id
      : undefined;

  if (typeof object_id !== "string" || object_id.length === 0) {
    return NextResponse.json({ error: "Missing object_id" }, { status: 400 });
  }

  // Check admin
  const { data: isAdmin, error: adminErr } = await supabase
    .schema("cse")
    .rpc("current_user_is_admin");

  if (adminErr) {
    return NextResponse.json({ error: adminErr.message }, { status: 500 });
  }
  if (!isAdmin) {
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
