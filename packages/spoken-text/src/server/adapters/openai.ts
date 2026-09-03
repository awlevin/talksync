import type { BlockKind, JsonValue, SpeechFn, TranscribeFn } from "../types.js";

/**
 * OpenAI speech and transcription, through the Vercel AI SDK.
 *
 * `ai` and `@ai-sdk/openai` are optional peer dependencies: they are imported
 * only when one of these adapters is actually called, so nothing that does not
 * use them has to install them.
 *
 * Needs `OPENAI_API_KEY` in the environment.
 */

export type OpenAISpeechOptions = {
  /** Default `"tts-1"`. */
  model?: string;
  /** Default `"alloy"`. */
  voice?: string;
  /**
   * How the text should be read. Not supported by every model. Pass a function
   * to say it differently per block: a heading is not read like a sentence.
   */
  instructions?: string | ((kind: BlockKind) => string | undefined);
  /** Merged into the `openai` provider options. */
  providerOptions?: Record<string, JsonValue>;
};

export const openaiSpeech =
  ({
    model = "tts-1",
    voice = "alloy",
    instructions,
    providerOptions,
  }: OpenAISpeechOptions = {}): SpeechFn =>
  async (text, { kind }) => {
    const [{ experimental_generateSpeech: generateSpeech }, { openai }] =
      await Promise.all([import("ai"), import("@ai-sdk/openai")]);

    const said =
      typeof instructions === "function" ? instructions(kind) : instructions;

    const { audio } = await generateSpeech({
      model: openai.speech(model),
      text,
      voice,
      ...(said ? { instructions: said } : {}),
      ...(providerOptions ? { providerOptions: { openai: providerOptions } } : {}),
    });

    return {
      audio: audio.uint8Array,
      contentType: audio.mediaType || "audio/mpeg",
    };
  };

export type OpenAITranscriptionOptions = {
  /** Default `"whisper-1"`. */
  model?: string;
  /** ISO-639-1 code. Pinning it makes the transcript steadier. */
  language?: string;
  /** Merged into the `openai` provider options. */
  providerOptions?: Record<string, JsonValue>;
};

export const openaiTranscription =
  ({
    model = "whisper-1",
    language,
    providerOptions,
  }: OpenAITranscriptionOptions = {}): TranscribeFn =>
  async ({ audio }) => {
    const [{ experimental_transcribe: transcribe }, { openai }] =
      await Promise.all([import("ai"), import("@ai-sdk/openai")]);

    const result = await transcribe({
      model: openai.transcription(model),
      audio,
      providerOptions: {
        openai: {
          timestampGranularities: ["word"],
          ...(language ? { language } : {}),
          ...providerOptions,
        },
      },
    });

    return {
      text: result.text,
      duration: result.durationInSeconds,
      // With word granularity asked for, each "segment" is one word.
      words: result.segments.map((segment) => ({
        text: segment.text,
        start: segment.startSecond,
        end: segment.endSecond,
      })),
    };
  };
