/**
 * spoken-text/server — the route behind `<SpokenText>`.
 *
 * ```ts
 * // app/api/transcription/route.ts
 * import {
 *   createAlignmentHandler,
 *   elevenlabsSpeech,
 *   vercelBlobCache,
 * } from "spoken-text/server";
 *
 * export const POST = createAlignmentHandler({
 *   speech: elevenlabsSpeech(),
 *   cache: vercelBlobCache(),
 * });
 * ```
 *
 * ElevenLabs returns the word timings with the audio, so there is nothing to
 * transcribe. With a speech model that does not — `openaiSpeech` — pass a
 * `transcribe` as well.
 *
 * The adapters are opt-in. Supply your own `speech`, `transcribe` and `cache`
 * and the package asks nothing of you but React.
 */
export { createAlignmentHandler } from "./createAlignmentHandler.js";
export { sha256Hex } from "./hash.js";

export { elevenlabsSpeech } from "./adapters/elevenlabs.js";
export type {
  ElevenLabsSpeechOptions,
  ElevenLabsVoiceSettings,
} from "./adapters/elevenlabs.js";

export { openaiSpeech, openaiTranscription } from "./adapters/openai.js";
export type {
  OpenAISpeechOptions,
  OpenAITranscriptionOptions,
} from "./adapters/openai.js";

export { vercelBlobCache } from "./adapters/vercelBlob.js";
export type { VercelBlobCacheOptions } from "./adapters/vercelBlob.js";

export type {
  AlignmentCache,
  AlignmentHandlerOptions,
  AlignmentResponseBody,
  BlockKind,
  CachedAlignment,
  JsonValue,
  SpeechAudio,
  SpeechContext,
  SpeechFn,
  SpokenWord,
  Transcript,
  TranscribeFn,
} from "./types.js";
