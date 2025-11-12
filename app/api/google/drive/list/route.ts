import { NextRequest, NextResponse } from "next/server";
import { getDriveClient } from "@/lib/google";
import { getStoredTokens } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  const tokens = getStoredTokens();

  if (!tokens) {
    return NextResponse.json(
      { error: "Missing Google authentication." },
      { status: 401 }
    );
  }

  try {
    const drive = getDriveClient(tokens);
    const { data } = await drive.files.list({
      q: "mimeType contains 'video/' and trashed = false",
      pageSize: 25,
      orderBy: "modifiedTime desc",
      fields:
        "files(id, name, description, modifiedTime, thumbnailLink, videoMediaMetadata(durationMillis,width,height))"
    });

    const videos =
      data.files?.map((file) => ({
        id: file.id!,
        name: file.name ?? "Untitled",
        description: file.description ?? undefined,
        modifiedTime: file.modifiedTime ?? undefined,
        thumbnailLink: file.thumbnailLink ?? undefined,
        durationMillis: file.videoMediaMetadata?.durationMillis ?? undefined,
        width: file.videoMediaMetadata?.width ?? undefined,
        height: file.videoMediaMetadata?.height ?? undefined
      })) ?? [];

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Drive list error", error);
    return NextResponse.json(
      { error: "Failed to load Drive videos." },
      { status: 500 }
    );
  }
}
