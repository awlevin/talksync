import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  alignmentKey,
  clearAlignmentCache,
  loadAlignment,
  peekAlignment,
} from "../alignmentCache.js";
import { createEndpointAligner } from "../fetchAlignment.js";
import type { Alignment } from "../types.js";

const answer = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const alignment = { audioUrl: "blob:x", words: [], duration: 1 };

describe("the default aligner", () => {
  beforeEach(clearAlignmentCache);
  afterEach(() => vi.unstubAllGlobals());

  /** The request the aligner made, parsed. */
  const sent = async (
    kind: "heading" | "paragraph" | "list" | "quote",
  ): Promise<{ url: string; body: unknown }> => {
    const fetched = vi.fn(async () => answer(alignment));
    vi.stubGlobal("fetch", fetched);

    await createEndpointAligner("/api/speech")("The title", { kind });

    const [url, init] = fetched.mock.calls[0] as unknown as [string, RequestInit];
    return { url, body: JSON.parse(String(init.body)) };
  };

  it("POSTs the text and the kind of block it came from", async () => {
    const { url, body } = await sent("heading");
    expect(url).toBe("/api/speech");
    expect(body).toEqual({ content: "The title", kind: "heading" });
  });

  it("sends whichever kind it was handed", async () => {
    expect(await sent("quote").then((r) => r.body)).toEqual({
      content: "The title",
      kind: "quote",
    });
  });

  it("reads the audio and the timings back", async () => {
    vi.stubGlobal("fetch", async () =>
      answer({
        audioUrl: "blob:said",
        duration: 2.5,
        words: [{ text: "Hi", start: 0, end: 0.4 }],
      }),
    );

    await expect(
      createEndpointAligner()("Hi", { kind: "paragraph" }),
    ).resolves.toEqual({
      audioUrl: "blob:said",
      duration: 2.5,
      words: [{ text: "Hi", start: 0, end: 0.4 }],
    });
  });

  it("throws with the route's own message", async () => {
    vi.stubGlobal("fetch", async () => answer({ error: "No API key." }, 500));

    await expect(
      createEndpointAligner()("Hi", { kind: "paragraph" }),
    ).rejects.toThrow("No API key.");
  });
});

describe("the in-memory cache", () => {
  beforeEach(clearAlignmentCache);

  it("keeps the same text under two kinds apart", async () => {
    const text = "A jar of flour and water";
    const heading = alignmentKey("/api/transcription", text, "heading");
    const paragraph = alignmentKey("/api/transcription", text, "paragraph");
    expect(heading).not.toBe(paragraph);

    const said = (audioUrl: string) => async (): Promise<Alignment> => ({
      audioUrl,
      words: [],
    });

    await loadAlignment(heading, said("blob:heading"));
    await loadAlignment(paragraph, said("blob:paragraph"));

    expect(peekAlignment(heading)?.audioUrl).toBe("blob:heading");
    expect(peekAlignment(paragraph)?.audioUrl).toBe("blob:paragraph");
  });
});
