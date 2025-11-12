import { NextResponse } from "next/server";
import { hasStoredTokens } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({
    authenticated: hasStoredTokens()
  });
}
