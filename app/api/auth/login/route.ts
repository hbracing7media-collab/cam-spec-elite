import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  const body = await req.json().catch(() => ({}));
  const email = body?.email;
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json(
    {
      ok: true,
      user: { id: data.user?.id ?? null, email: data.user?.email ?? null },
    },
    { status: 200 }
  );
}
