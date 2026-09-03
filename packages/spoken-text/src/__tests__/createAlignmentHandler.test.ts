import { describe, expect, it, vi } from "vitest";
import { createAlignmentHandler } from "../server/createAlignmentHandler.js";
import type {
  AlignmentResponseBody,
  SpeechAudio,
  SpeechFn,
  TranscribeFn,
} from "../server/types.js";

const post = (body: unknown) =>
  new Request("http://localhost/api/transcription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const AUDIO = new Uint8Array([1, 2, 3]);

/** Speech that hands its own timings back, the way ElevenLabs does. */
const timed: SpeechFn = async () => ({
  audio: AUDIO,
  contentType: "audio/mpeg",
  words: [{ text: "Hi", start: 0, end: 0.4 }],
  duration: 0.4,
});

/** Speech that only makes audio, the way OpenAI does. */
const untimed: SpeechFn = async () => ({
  audio: AUDIO,
  contentType: "audio/mpeg",
});

const heard: TranscribeFn = async () => ({
  words: [{ text: "Heard", start: 0, end: 1 }],
  duration: 1,
});

const read = async (response: Response) =>
  (await response.json()) as AlignmentResponseBody & { error?: string };

describe("createAlignmentHandler - where the timings come from", () => {
  it("uses the speech model's own timings, and never transcribes", async () => {
    const transcribe = vi.fn(heard);
    const handler = createAlignmentHandler({ speech: timed, transcribe });

    const body = await read(await handler(post({ content: "Hi" })));

    expect(transcribe).not.toHaveBeenCalled();
    expect(body.words).toEqual([{ text: "Hi", start: 0, end: 0.4 }]);
    expect(body.duration).toBe(0.4);
    expect(body.audioUrl).toMatch(/^data:audio\/mpeg;base64,/);
  });

  it("falls back to the transcriber when speech returns no timings", async () => {
    const transcribe = vi.fn(heard);
    const handler = createAlignmentHandler({ speech: untimed, transcribe });

    const body = await read(await handler(post({ content: "Hi" })));

    expect(transcribe).toHaveBeenCalledTimes(1);
    expect(body.words).toEqual([{ text: "Heard", start: 0, end: 1 }]);
  });

  it("says what is missing when neither supplies timings", async () => {
    const handler = createAlignmentHandler({
      speech: untimed,
      onError: () => {},
    });

    const response = await handler(post({ content: "Hi" }));
    const body = await read(response);

    expect(response.status).toBe(500);
    expect(body.error).toContain("No word timings");
    expect(body.error).toContain("elevenlabsSpeech");
    expect(body.error).toContain("transcribe");
  });
});

describe("createAlignmentHandler - the kind of block", () => {
  /** The kind the handler passed on to each of its collaborators. */
  const run = async (body: unknown) => {
    const speech = vi.fn(timed);
    const hash = vi.fn(async (text: string, kind: string) => `${kind}:${text}`);
    const handler = createAlignmentHandler({ speech, hash });
    const response = await handler(post(body));
    return { speech, hash, response };
  };

  it("hands the kind to the speech model and to the hash", async () => {
    const { speech, hash, response } = await run({
      content: "The title",
      kind: "heading",
    });

    expect(response.status).toBe(200);
    expect(speech).toHaveBeenCalledWith("The title", { kind: "heading" });
    expect(hash).toHaveBeenCalledWith("The title", "heading");
  });

  it("reads a body without a kind as prose", async () => {
    const { speech, hash } = await run({ content: "Some prose." });

    expect(speech).toHaveBeenCalledWith("Some prose.", { kind: "paragraph" });
    expect(hash).toHaveBeenCalledWith("Some prose.", "paragraph");
  });

  it("turns away a kind it does not know", async () => {
    const { speech, response } = await run({ content: "Hi", kind: "sidebar" });

    expect(response.status).toBe(400);
    expect((await read(response)).error).toContain("`kind` must be one of");
    expect(speech).not.toHaveBeenCalled();
  });

  it("gives the same text under two kinds two cache entries", async () => {
    const store = new Map<string, AlignmentResponseBody>();
    const speech = vi.fn(timed);
    const handler = createAlignmentHandler({
      speech,
      cache: {
        get: async (key) => store.get(key) ?? null,
        set: async (key, audio: SpeechAudio, words, duration) => {
          const entry = { audioUrl: `stored:${key}`, words, duration };
          store.set(key, entry);
          return entry;
        },
      },
    });

    await handler(post({ content: "A jar of flour", kind: "heading" }));
    await handler(post({ content: "A jar of flour", kind: "paragraph" }));
    await handler(post({ content: "A jar of flour", kind: "heading" }));

    // Two recordings for two kinds, and the third request is a cache hit.
    expect(store.size).toBe(2);
    expect(speech).toHaveBeenCalledTimes(2);
  });
});
