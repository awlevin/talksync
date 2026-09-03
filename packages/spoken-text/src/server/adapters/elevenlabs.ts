import type { BlockKind, SpeechFn, SpokenWord } from "../types.js";

/**
 * ElevenLabs speech, with the word timings included.
 *
 * The `with-timestamps` endpoint returns the audio and a timestamp for every
 * character of the text it was given, in one call. That removes the
 * transcription step and the drift with it: the timings are the model's own
 * record of what it said, not a second model's guess at it.
 *
 * Plain `fetch`, so there is no SDK to install. Needs `ELEVENLABS_API_KEY` (or
 * `ELEVEN_LABS_API_KEY`) in the environment, or a `apiKey` passed here.
 */

const ENDPOINT = "https://api.elevenlabs.io/v1/text-to-speech";

/**
 * "Rachel" and the rest of the voice library need a paid plan. George is a
 * premade voice, which every tier can use.
 */
const GEORGE = "JBFqnCBsd6RMkjVDRZzb";

/** How ElevenLabs is asked to read. Left out, the voice keeps its own settings. */
export type ElevenLabsVoiceSettings = {
  /** 0-1. Lower wanders more; higher reads flatter. */
  stability?: number;
  /** 0-1. How close to the original voice to stay. */
  similarity_boost?: number;
  /** 0-1. Exaggerates the voice's own delivery. */
  style?: number;
  /** 0.7-1.2. Below 1 is slower. */
  speed?: number;
  use_speaker_boost?: boolean;
};

export type ElevenLabsSpeechOptions = {
  /** Default `"JBFqnCBsd6RMkjVDRZzb"` — George, a premade voice. */
  voiceId?: string;
  /** Default `"eleven_multilingual_v2"`. */
  modelId?: string;
  /** Overrides `ELEVENLABS_API_KEY` / `ELEVEN_LABS_API_KEY`. */
  apiKey?: string;
  /** Default `"mp3_44100_128"`. */
  outputFormat?: string;
  /** Settings for every block, or a function that answers per kind. */
  voiceSettings?:
    | ElevenLabsVoiceSettings
    | ((kind: BlockKind) => ElevenLabsVoiceSettings | undefined);
};

/** What the endpoint returns. Only the fields this adapter reads. */
type TimestampedSpeech = {
  audio_base64?: string;
  alignment?: {
    characters?: string[];
    character_start_times_seconds?: number[];
    character_end_times_seconds?: number[];
  } | null;
};

/** The format is named after its codec, and the codec is the content type. */
const contentTypeOf = (outputFormat: string): string => {
  if (outputFormat.startsWith("opus_")) return "audio/ogg";
  if (outputFormat.startsWith("pcm_")) return "audio/wave";
  if (outputFormat.startsWith("ulaw_") || outputFormat.startsWith("alaw_")) {
    return "audio/basic";
  }
  return "audio/mpeg";
};

const fromBase64 = (value: string): Uint8Array => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

/**
 * Character timings into word timings: a word runs from the start of its first
 * character to the end of its last, and whitespace ends it. Punctuation is not
 * whitespace, so it stays attached to the word it was typed against — which is
 * what the client's tokenizer produces too.
 */
export const wordsFromCharacters = (
  characters: readonly string[],
  starts: readonly number[],
  ends: readonly number[],
): SpokenWord[] => {
  const words: SpokenWord[] = [];
  let text = "";
  let start = 0;
  let end = 0;

  const close = () => {
    if (text) words.push({ text, start, end });
    text = "";
  };

  for (let i = 0; i < characters.length; i += 1) {
    const character = characters[i];
    if (/\s/.test(character)) {
      close();
      continue;
    }
    if (!text) start = starts[i] ?? 0;
    text += character;
    end = ends[i] ?? start;
  }
  close();

  return words;
};

const errorFrom = async (response: Response): Promise<Error> => {
  let detail = "";
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body?.detail === "string") detail = body.detail;
    else if (body?.detail != null) detail = JSON.stringify(body.detail);
  } catch {
    // Not JSON. The status is all there is to say.
  }
  return new Error(
    `ElevenLabs speech failed: ${response.status}${detail ? ` — ${detail}` : ""}`,
  );
};

export const elevenlabsSpeech =
  ({
    voiceId = GEORGE,
    modelId = "eleven_multilingual_v2",
    apiKey,
    outputFormat = "mp3_44100_128",
    voiceSettings,
  }: ElevenLabsSpeechOptions = {}): SpeechFn =>
  async (text, { kind }) => {
    // Read at call time, so importing the adapter never fails on a missing key.
    const key =
      apiKey ??
      process.env.ELEVENLABS_API_KEY ??
      process.env.ELEVEN_LABS_API_KEY;
    if (!key) {
      throw new Error(
        "No ElevenLabs API key. Set ELEVENLABS_API_KEY (or ELEVEN_LABS_API_KEY), " +
          "or pass `apiKey` to elevenlabsSpeech().",
      );
    }

    const settings =
      typeof voiceSettings === "function" ? voiceSettings(kind) : voiceSettings;

    const response = await fetch(
      `${ENDPOINT}/${voiceId}/with-timestamps?output_format=${encodeURIComponent(outputFormat)}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          ...(settings ? { voice_settings: settings } : {}),
        }),
      },
    );

    if (!response.ok) throw await errorFrom(response);

    const body = (await response.json()) as TimestampedSpeech;
    if (!body.audio_base64) {
      throw new Error("ElevenLabs returned no audio.");
    }

    // `alignment` is timed against the text as it was sent;
    // `normalized_alignment` is timed against ElevenLabs' rewrite of it, which
    // no longer lines up with the words on the page.
    const characters = body.alignment?.characters ?? [];
    const starts = body.alignment?.character_start_times_seconds ?? [];
    const ends = body.alignment?.character_end_times_seconds ?? [];

    return {
      audio: fromBase64(body.audio_base64),
      contentType: contentTypeOf(outputFormat),
      words: wordsFromCharacters(characters, starts, ends),
      duration: ends.length ? ends[ends.length - 1] : undefined,
    };
  };
