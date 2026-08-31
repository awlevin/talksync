import { sha256Hex, toBase64 } from "./hash.js";
import type {
  AlignmentHandlerOptions,
  AlignmentResponseBody,
  CachedAlignment,
  SpeechAudio,
  SpokenWord,
} from "./types.js";

const DEFAULT_MAX_LENGTH = 2000;

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Read `{ content }` off the request, or say why it could not be read. */
const readContent = async (
  request: Request,
  maxLength: number,
): Promise<{ content: string } | { error: string }> => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: "Expected a JSON body." };
  }

  const content = (body as { content?: unknown } | null)?.content;
  if (typeof content !== "string" || content.trim() === "") {
    return { error: "Expected a non-empty string at `content`." };
  }
  if (content.length > maxLength) {
    return { error: `\`content\` is longer than ${maxLength} characters.` };
  }
  return { content };
};

/** No cache configured: hand the audio back inline. */
const inlineAlignment = (
  audio: SpeechAudio,
  words: SpokenWord[],
  duration?: number,
): CachedAlignment => ({
  audioUrl: `data:${audio.contentType};base64,${toBase64(audio.audio)}`,
  words,
  duration,
});

/**
 * A route handler that turns a passage into audio plus word-level timings,
 * which is everything `<SpokenText>` needs.
 *
 * It is a plain `(Request) => Response`, so it mounts anywhere that speaks the
 * web standard:
 *
 * ```ts
 * // app/api/transcription/route.ts
 * export const POST = createAlignmentHandler({ speech, transcribe, cache });
 * ```
 *
 * Speech, transcription and storage are all yours to supply. `openaiSpeech`,
 * `openaiTranscription` and `vercelBlobCache` are bundled as opt-in adapters,
 * and nothing in the package requires them.
 */
export const createAlignmentHandler = ({
  speech,
  transcribe,
  cache,
  maxLength = DEFAULT_MAX_LENGTH,
  hash = sha256Hex,
  onError = (error) => console.error("[spoken-text] alignment failed", error),
}: AlignmentHandlerOptions) => {
  return async (request: Request): Promise<Response> => {
    const parsed = await readContent(request, maxLength);
    if ("error" in parsed) return json({ error: parsed.error }, 400);

    try {
      const key = await hash(parsed.content);

      const cached = await cache?.get(key);
      if (cached) return json(cached satisfies AlignmentResponseBody, 200);

      const audio = await speech(parsed.content);
      const transcript = await transcribe(audio);

      const alignment = cache
        ? await cache.set(key, audio, transcript.words, transcript.duration)
        : inlineAlignment(audio, transcript.words, transcript.duration);

      return json(alignment satisfies AlignmentResponseBody, 200);
    } catch (error) {
      onError(error);
      return json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        500,
      );
    }
  };
};
