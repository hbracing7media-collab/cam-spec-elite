import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// Admin check helper
async function isAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRole) return false;
  
  const cookieStore = await cookies();
  const access_token = cookieStore.get("sb-access-token")?.value;
  if (!access_token) return false;
  
  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data } = await supabase.auth.getUser(access_token);
  
  // Check if user is admin (you can customize this check)
  const adminEmails = ["philliphudson24@gmail.com"]; // Add admin emails
  return data.user && adminEmails.includes(data.user.email || "");
}

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    return NextResponse.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
  }

  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("cse_parts_products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, products: data });
}

export async function POST(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    return NextResponse.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
  }

  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  
  // Generate slug from brand and part number
  const slug = `${body.brand}-${body.part_number}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("cse_parts_products")
    .insert({
      ...body,
      slug,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, product: data });
}
