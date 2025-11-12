import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient, serializeTokens } from "@/lib/google";

const COOKIE_NAME = "g_tokens";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/?auth=error", req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?auth=missing-code", req.url));
  }

  try {
    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);
    const encoded = serializeTokens(tokens);

    const response = NextResponse.redirect(new URL("/", req.url));
    response.cookies.set({
      name: COOKIE_NAME,
      value: encoded,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30
    });
    return response;
  } catch (err) {
    console.error("Google OAuth callback error", err);
    return NextResponse.redirect(new URL("/?auth=callback-error", req.url));
  }
}
