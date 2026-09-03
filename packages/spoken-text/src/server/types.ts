import type { BlockKind, SpokenWord } from "../types.js";

export type { BlockKind, SpokenWord };

/** What the client says about the passage, beyond the text itself. */
export type SpeechContext = { kind: BlockKind };

/** Anything that survives `JSON.stringify`. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/** Generated audio, and the MIME type the bytes are in. */
export type SpeechAudio = {
  audio: Uint8Array;
  /** For example `"audio/mpeg"`. Used as the `Content-Type` when stored. */
  contentType: string;
  /**
   * Word timings, when the speech model returned them with the audio. Supplying
   * them skips transcription entirely: they are the model's own record of what
   * it said, so there is no second model to disagree with.
   */
  words?: SpokenWord[];
  /** Total length in seconds, if the speech model reported one. */
  duration?: number;
};

/**
 * Turn a passage into audio. `context` tells the voice what kind of block it
 * is reading; an adapter written as `(text) => …` ignores it and still fits.
 */
export type SpeechFn = (
  text: string,
  context: SpeechContext,
) => Promise<SpeechAudio>;

/** What a transcriber heard in the generated audio. */
export type Transcript = {
  /** Word-level timings. Without these there is nothing to highlight. */
  words: SpokenWord[];
  /** Total length in seconds, if the transcriber reported one. */
  duration?: number;
  /** The full transcript, if the transcriber returned one. */
  text?: string;
};

/** Read word-level timings back off generated audio. */
export type TranscribeFn = (audio: SpeechAudio) => Promise<Transcript>;

/** Audio that has been stored somewhere a browser can fetch it, plus timings. */
export type CachedAlignment = {
  audioUrl: string;
  words: SpokenWord[];
  duration?: number;
};

/**
 * Somewhere to keep generated audio so it is only ever made once.
 *
 * The key is a hash of the passage, so any two identical passages hit the same
 * entry. Implement it over S3, Redis, a database, the filesystem — anything
 * that can hand back a URL a browser can play.
 */
export type AlignmentCache = {
  /** The stored alignment for `hash`, or `null` if there is none. */
  get: (hash: string) => Promise<CachedAlignment | null>;
  /** Store the audio and its timings, and return the URL they can be read at. */
  set: (
    hash: string,
    audio: SpeechAudio,
    words: SpokenWord[],
    duration?: number,
  ) => Promise<CachedAlignment>;
};

export type AlignmentHandlerOptions = {
  /** Turns the passage into audio. */
  speech: SpeechFn;
  /**
   * Reads word-level timings back off that audio. Only needed when `speech`
   * does not return `words` of its own.
   */
  transcribe?: TranscribeFn;
  /**
   * Where generated audio is kept. Without one, every request regenerates the
   * audio and returns it inline as a `data:` URL — fine for a local try-out,
   * far too slow and expensive for anything else.
   */
  cache?: AlignmentCache;
  /** Longest passage accepted, in characters. Default `2000`. */
  maxLength?: number;
  /**
   * The cache key for a passage. Default: the SHA-256 of the kind and the text.
   * Override it to fold the voice or model into the key, so changing either
   * misses the cache instead of replaying the old recording.
   */
  hash?: (text: string, kind: BlockKind) => string | Promise<string>;
  /** Called with anything thrown while generating. Default: `console.error`. */
  onError?: (error: unknown) => void;
};

/** The wire format the client's default aligner expects. */
export type AlignmentResponseBody = {
  audioUrl: string;
  words: SpokenWord[];
  duration?: number;
};
