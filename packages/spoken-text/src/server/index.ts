/**
 * spoken-text/server — the route behind `<SpokenText>`.
 *
 * ```ts
 * // app/api/transcription/route.ts
 * import {
 *   createAlignmentHandler,
 *   openaiSpeech,
 *   openaiTranscription,
 *   vercelBlobCache,
 * } from "spoken-text/server";
 *
 * export const POST = createAlignmentHandler({
 *   speech: openaiSpeech({ voice: "nova" }),
 *   transcribe: openaiTranscription({ language: "en" }),
 *   cache: vercelBlobCache(),
 * });
 * ```
 *
 * The three adapters are opt-in. Supply your own `speech`, `transcribe` and
 * `cache` and the package asks nothing of you but React.
 */
export { createAlignmentHandler } from "./createAlignmentHandler.js";
export { sha256Hex } from "./hash.js";

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
  CachedAlignment,
  JsonValue,
  SpeechAudio,
  SpeechFn,
  SpokenWord,
  Transcript,
  TranscribeFn,
} from "./types.js";
