import { NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/google";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/userinfo.email"
];

export async function GET() {
  try {
    const client = getOAuthClient();
    const url = client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES
    });
    return NextResponse.json({ url });
  } catch (error: unknown) {
    console.error("Failed to generate Google auth URL", error);
    return NextResponse.json(
      {
        error: "Failed to generate authorization link."
      },
      { status: 500 }
    );
  }
}
