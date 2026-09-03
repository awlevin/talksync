import {
  createAlignmentHandler,
  elevenlabsSpeech,
  vercelBlobCache,
} from "spoken-text/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * The whole server half of the demo. ElevenLabs reads the passage and returns
 * the word timings with the audio, so there is nothing to transcribe, and both
 * are kept in Vercel Blob so no passage is ever generated twice.
 *
 * Headings are read a little slower and a little steadier than prose, which is
 * what a title wants.
 */
export const POST = createAlignmentHandler({
  speech: elevenlabsSpeech({
    voiceSettings: (kind) =>
      kind === "heading" ? { speed: 0.9, stability: 0.6 } : undefined,
  }),
  cache: vercelBlobCache(),
  maxLength: 2000,
});
