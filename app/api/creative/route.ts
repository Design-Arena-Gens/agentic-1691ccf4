import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

type CreativeRequest = {
  fileName: string;
  brief?: string;
  target?: string;
  tone?: string;
};

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 }
    );
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    const body = (await req.json()) as CreativeRequest;
    const { fileName, brief, target, tone } = body;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      reasoning: { effort: "medium" },
      input: [
        {
          role: "system",
          content:
            "You are a veteran YouTube growth strategist tasked with crafting viral-ready video metadata. Always return strict JSON with `title`, `description`, and `hashtags` array."
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Video file: ${fileName}
Creative brief: ${brief ?? "Not provided"}
Target audience: ${target ?? "General YouTube audience"}
Tone: ${tone ?? "High energy"}

Constraints:
- Title <= 90 chars, must hook curiosity.
- Description <= 4000 chars. Start with 3-sentence hook, then bullet CTA, then hashtags.
- Provide 15 hashtags optimized for virality, mix of niche + broad.`
            }
          ]
        }
      ]
    });

    const text = response.output_text;
    if (!text?.length) {
      throw new Error("Unexpected OpenAI response format");
    }
    const parsed = JSON.parse(text[0]) as {
      title: string;
      description: string;
      hashtags: string[];
    };

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Creative generation failed", error);
    return NextResponse.json(
      { error: "Failed to generate creative assets." },
      { status: 500 }
    );
  }
}
