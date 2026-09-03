import { afterEach, describe, expect, it, vi } from "vitest";
import {
  elevenlabsSpeech,
  wordsFromCharacters,
} from "../server/adapters/elevenlabs.js";

/**
 * The shape ElevenLabs' `with-timestamps` endpoint returns, at the size a test
 * can read: one character per timestamp, timed in tenths.
 */
const alignmentFor = (text: string) => ({
  characters: [...text],
  character_start_times_seconds: [...text].map((_, i) => i / 10),
  character_end_times_seconds: [...text].map((_, i) => (i + 1) / 10),
});

const spoke = (text: string, extra: Record<string, unknown> = {}) =>
  new Response(
    JSON.stringify({
      audio_base64: "AAEC", // three bytes: 0, 1, 2
      alignment: alignmentFor(text),
      normalized_alignment: alignmentFor(text.toUpperCase()),
      ...extra,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );

const failed = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Run the adapter against a stubbed endpoint and hand back what it sent. */
const call = async (
  response: Response,
  options: Parameters<typeof elevenlabsSpeech>[0] = {},
  kind: "heading" | "paragraph" | "list" | "quote" = "paragraph",
  text = "Hello there.",
) => {
  const fetched = vi.fn(async () => response);
  vi.stubGlobal("fetch", fetched);

  const speak = elevenlabsSpeech({ apiKey: "test-key", ...options });
  const result = await speak(text, { kind }).catch((error: Error) => error);

  const [url, init] = (fetched.mock.calls[0] ?? []) as unknown as [
    string,
    RequestInit,
  ];
  return {
    result,
    url,
    headers: init?.headers as Record<string, string>,
    body: init?.body ? JSON.parse(String(init.body)) : undefined,
  };
};

afterEach(() => vi.unstubAllGlobals());

describe("wordsFromCharacters", () => {
  const timed = (text: string) => {
    const a = alignmentFor(text);
    return wordsFromCharacters(
      a.characters,
      a.character_start_times_seconds,
      a.character_end_times_seconds,
    );
  };

  it("keeps punctuation on the word it was typed against", () => {
    expect(timed("Hi, there.")).toEqual([
      { text: "Hi,", start: 0, end: 0.3 },
      { text: "there.", start: 0.4, end: 1 },
    ]);
  });

  it("does not invent a word out of two spaces", () => {
    expect(timed("a  b").map((w) => w.text)).toEqual(["a", "b"]);
  });

  it("ignores a trailing newline", () => {
    const words = timed("done\n");
    expect(words.map((w) => w.text)).toEqual(["done"]);
    expect(words[0].end).toBe(0.4);
  });

  it("splits on every kind of whitespace", () => {
    expect(timed("one\ttwo\nthree four").map((w) => w.text)).toEqual([
      "one",
      "two",
      "three",
      "four",
    ]);
  });

  it("says nothing about text that is all whitespace", () => {
    expect(timed("   ")).toEqual([]);
  });

  it("runs a word from its first character to its last", () => {
    // "art" is characters 4, 5 and 6 of "The art of it".
    const word = timed("The art of it")[1];
    expect(word).toEqual({ text: "art", start: 0.4, end: 0.7 });
  });
});

describe("elevenlabsSpeech - the request", () => {
  it("asks the timestamped endpoint for the configured voice and format", async () => {
    const { url, headers, body } = await call(spoke("Hello there."), {
      voiceId: "abc123",
      modelId: "eleven_turbo_v2_5",
      outputFormat: "mp3_22050_32",
    });

    expect(url).toBe(
      "https://api.elevenlabs.io/v1/text-to-speech/abc123/with-timestamps?output_format=mp3_22050_32",
    );
    expect(headers["xi-api-key"]).toBe("test-key");
    expect(body).toEqual({
      text: "Hello there.",
      model_id: "eleven_turbo_v2_5",
    });
  });

  it("defaults to George, a premade voice every plan can use", async () => {
    const { url } = await call(spoke("Hi."));
    expect(url).toContain("/JBFqnCBsd6RMkjVDRZzb/with-timestamps");
    expect(url).toContain("output_format=mp3_44100_128");
  });

  it("sends voice settings, and asks for them per kind when given a function", async () => {
    const perKind = (kind: string) =>
      kind === "heading" ? { speed: 0.9, stability: 0.6 } : undefined;

    const heading = await call(
      spoke("The title"),
      { voiceSettings: perKind },
      "heading",
    );
    expect(heading.body.voice_settings).toEqual({ speed: 0.9, stability: 0.6 });

    const prose = await call(
      spoke("The prose."),
      { voiceSettings: perKind },
      "paragraph",
    );
    expect(prose.body.voice_settings).toBeUndefined();

    const flat = await call(spoke("Hi."), { voiceSettings: { style: 0.2 } });
    expect(flat.body.voice_settings).toEqual({ style: 0.2 });
  });

  it("asks for the key only when it is called", async () => {
    // Building the adapter must not throw, so a route file still imports.
    const speak = elevenlabsSpeech({ apiKey: undefined });
    const before = { ...process.env };
    delete process.env.ELEVENLABS_API_KEY;
    delete process.env.ELEVEN_LABS_API_KEY;

    await expect(speak("Hi.", { kind: "paragraph" })).rejects.toThrow(
      /ELEVENLABS_API_KEY/,
    );

    Object.assign(process.env, before);
  });

  it("reads the key from either spelling of the environment variable", async () => {
    const before = { ...process.env };
    delete process.env.ELEVENLABS_API_KEY;
    process.env.ELEVEN_LABS_API_KEY = "from-env";

    const fetched = vi.fn(async () => spoke("Hi."));
    vi.stubGlobal("fetch", fetched);
    await elevenlabsSpeech()("Hi.", { kind: "paragraph" });

    const [, init] = fetched.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>)["xi-api-key"]).toBe(
      "from-env",
    );

    delete process.env.ELEVEN_LABS_API_KEY;
    Object.assign(process.env, before);
  });
});

describe("elevenlabsSpeech - the response", () => {
  it("returns the audio, its type, the words and the duration", async () => {
    const { result } = await call(spoke("Hi there."));
    if (result instanceof Error) throw result;

    expect(Array.from(result.audio)).toEqual([0, 1, 2]);
    expect(result.contentType).toBe("audio/mpeg");
    expect(result.words).toEqual([
      { text: "Hi", start: 0, end: 0.2 },
      { text: "there.", start: 0.3, end: 0.9 },
    ]);
    // The last character's end is the length of the recording.
    expect(result.duration).toBe(0.9);
  });

  it("times against the text it was sent, not the normalized rewrite", async () => {
    const { result } = await call(spoke("hi"));
    if (result instanceof Error) throw result;
    expect(result.words?.map((w) => w.text)).toEqual(["hi"]);
  });

  it("names the content type after the format it asked for", async () => {
    const opus = await call(spoke("Hi."), { outputFormat: "opus_48000_64" });
    const pcm = await call(spoke("Hi."), { outputFormat: "pcm_24000" });
    if (opus.result instanceof Error) throw opus.result;
    if (pcm.result instanceof Error) throw pcm.result;

    expect(opus.result.contentType).toBe("audio/ogg");
    expect(pcm.result.contentType).toBe("audio/wave");
  });

  it("carries the status and the detail into the error", async () => {
    const { result } = await call(
      failed(402, {
        detail: {
          status: "paid_plan_required",
          message: "Free users cannot use library voices via the API.",
        },
      }),
    );

    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toContain("402");
    expect((result as Error).message).toContain("paid_plan_required");
    expect((result as Error).message).toContain("library voices");
  });

  it("carries a plain-string detail through too", async () => {
    const { result } = await call(failed(401, { detail: "Invalid API key." }));
    expect((result as Error).message).toBe(
      "ElevenLabs speech failed: 401 — Invalid API key.",
    );
  });

  it("reports the status alone when the body is not JSON", async () => {
    const { result } = await call(new Response("upstream down", { status: 502 }));
    expect((result as Error).message).toBe("ElevenLabs speech failed: 502");
  });

  it("complains when a 200 comes back without audio", async () => {
    const { result } = await call(
      new Response(JSON.stringify({ alignment: alignmentFor("Hi.") }), {
        status: 200,
      }),
    );
    expect((result as Error).message).toBe("ElevenLabs returned no audio.");
  });

  it("returns the audio even when the alignment is missing", async () => {
    const { result } = await call(
      new Response(JSON.stringify({ audio_base64: "AAEC" }), { status: 200 }),
    );
    if (result instanceof Error) throw result;

    expect(result.words).toEqual([]);
    expect(result.duration).toBeUndefined();
  });
});
