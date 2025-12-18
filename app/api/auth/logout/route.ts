import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true, message: "Logged out" });
  response.cookies.set("sb-access-token", "", { maxAge: 0, path: "/" });
  response.cookies.set("sb-refresh-token", "", { maxAge: 0, path: "/" });
  return response;
}