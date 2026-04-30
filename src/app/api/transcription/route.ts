import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrMakeAudioAndTranscription } from "@/lib/getOrMakeAudioAndTranscription";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 60;

env();

const requestSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function POST(req: Request) {
  let parsed: z.infer<typeof requestSchema>;
  try {
    parsed = requestSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body", details: err instanceof z.ZodError ? err.issues : undefined },
      { status: 400 },
    );
  }

  try {
    const result = await getOrMakeAudioAndTranscription(parsed.content);
    return NextResponse.json(result);
  } catch (err) {
    console.error("transcription failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
