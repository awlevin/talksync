import {
  createAlignmentHandler,
  openaiSpeech,
  openaiTranscription,
  vercelBlobCache,
} from "spoken-text/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * The whole server half of the demo. `tts-1` reads the passage, `whisper-1`
 * reads the word timings back off the recording, and both are kept in Vercel
 * Blob so no passage is ever generated twice.
 */
export const POST = createAlignmentHandler({
  speech: openaiSpeech({ model: "tts-1", voice: "nova" }),
  transcribe: openaiTranscription({
    model: "whisper-1",
    language: "en",
    providerOptions: {
      temperature: 0.5,
      prompt: "Don't stop transcribing early please!",
    },
  }),
  cache: vercelBlobCache(),
  maxLength: 2000,
});
