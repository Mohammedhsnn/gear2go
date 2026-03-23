import OpenAI from "openai";
import { NextResponse } from "next/server";
import { moderateTextByCategory } from "@/lib/moderation";

export const runtime = "nodejs";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

function blurText(text: string): string {
  return text.replace(/[^\s]/g, "•");
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { message?: string }
    | null;

  const message = body?.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "message is verplicht" }, { status: 400 });
  }

  const client = getOpenAIClient();

  if (!client) {
    const fallback = moderateTextByCategory(message, "X");
    return NextResponse.json({
      blocked: fallback.blocked,
      text: fallback.text,
      source: "local-fallback",
    });
  }

  try {
    const result = await client.moderations.create({
      model: "omni-moderation-latest",
      input: message,
    });

    const output = result.results?.[0];
    const flagged = output?.flagged ?? false;

    if (flagged) {
      return NextResponse.json({
        blocked: true,
        text: blurText(message),
        source: "openai",
      });
    }

    return NextResponse.json({
      blocked: false,
      text: message,
      source: "openai",
    });
  } catch {
    const fallback = moderateTextByCategory(message, "X");
    return NextResponse.json({
      blocked: fallback.blocked,
      text: fallback.text,
      source: "local-fallback",
    });
  }
}