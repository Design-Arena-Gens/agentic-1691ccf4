import { NextResponse } from "next/server";

const COOKIE_NAME = "g_tokens";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0
  });
  return response;
}
