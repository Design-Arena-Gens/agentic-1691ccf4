import { NextRequest, NextResponse } from "next/server";
import { getDriveClient, getYouTubeClient } from "@/lib/google";
import { getStoredTokens } from "@/lib/auth";

type UploadPayload = {
  fileId: string;
  title: string;
  description: string;
  hashtags: string[];
  privacyStatus?: "private" | "public" | "unlisted";
  publishAt?: string | null;
};

export async function POST(req: NextRequest) {
  const tokens = getStoredTokens();
  if (!tokens) {
    return NextResponse.json(
      { error: "Missing Google authentication." },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as UploadPayload;
    if (!body.fileId) {
      return NextResponse.json(
        { error: "fileId is required" },
        { status: 400 }
      );
    }

    const drive = getDriveClient(tokens);
    const youtube = getYouTubeClient(tokens);

    const [metadataRes, mediaRes] = await Promise.all([
      drive.files.get({
        fileId: body.fileId,
        fields: "id, name, videoMediaMetadata(durationMillis,width,height)"
      }),
      drive.files.get(
        { fileId: body.fileId, alt: "media" },
        { responseType: "stream" }
      )
    ]);

    const hashtags = (body.hashtags ?? []).map((tag) =>
      tag.startsWith("#") ? tag.slice(1) : tag
    );
    const decoratedDescription =
      body.description.trim() +
      "\n\n" +
      hashtags.map((tag) => `#${tag}`).join(" ");

    const publishAt =
      body.publishAt && body.publishAt.trim().length > 0
        ? new Date(body.publishAt).toISOString()
        : undefined;

    const response = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: body.title,
          description: decoratedDescription,
          tags: hashtags,
          categoryId: "24" // Entertainment default
        },
        status: {
          privacyStatus: body.privacyStatus ?? "unlisted",
          publishAt,
          selfDeclaredMadeForKids: false
        }
      },
      media: {
        body: mediaRes.data as unknown as NodeJS.ReadableStream
      }
    });

    return NextResponse.json({
      videoId: response.data.id,
      fileName: metadataRes.data.name,
      durationMillis: metadataRes.data.videoMediaMetadata?.durationMillis
    });
  } catch (error) {
    console.error("YouTube upload failed", error);
    return NextResponse.json(
      { error: "YouTube upload failed." },
      { status: 500 }
    );
  }
}
