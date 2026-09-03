import { beforeEach, describe, expect, it, vi } from "vitest";
import { openaiSpeech } from "../server/adapters/openai.js";

/**
 * The adapter imports `ai` and `@ai-sdk/openai` only when it is called, so the
 * test stands in for both and reads the arguments it was given. Nothing here
 * touches the network.
 */
const generateSpeech = vi.fn(async (options: Record<string, unknown>) => {
  void options;
  return { audio: { uint8Array: new Uint8Array([1]), mediaType: "audio/mpeg" } };
});

vi.mock("ai", () => ({
  experimental_generateSpeech: (
    ...args: Parameters<typeof generateSpeech>
  ) => generateSpeech(...args),
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: { speech: (model: string) => ({ model }) },
}));

/** What `generateSpeech` was asked for. */
const asked = () => generateSpeech.mock.calls[0][0];

beforeEach(() => generateSpeech.mockClear());

describe("openaiSpeech - instructions", () => {
  it("takes one instruction for every block", async () => {
    await openaiSpeech({ instructions: "Read it warmly." })("Hi.", {
      kind: "heading",
    });

    expect(asked().instructions).toBe("Read it warmly.");
  });

  it("asks a function what to say for this kind of block", async () => {
    const instructions = vi.fn((kind: string) =>
      kind === "heading" ? "Announce it." : "Read it warmly.",
    );

    await openaiSpeech({ instructions })("The title", { kind: "heading" });

    expect(instructions).toHaveBeenCalledWith("heading");
    expect(asked().instructions).toBe("Announce it.");
  });

  it("leaves instructions off when the function has nothing to say", async () => {
    await openaiSpeech({ instructions: () => undefined })("Hi.", {
      kind: "list",
    });

    expect(asked()).not.toHaveProperty("instructions");
  });

  it("keeps its defaults, and sends no timings of its own", async () => {
    const result = await openaiSpeech()("Hi.", { kind: "paragraph" });

    expect(asked().voice).toBe("alloy");
    expect(asked().model).toEqual({ model: "tts-1" });
    expect(asked()).not.toHaveProperty("instructions");
    // No word timings, so the handler still needs a transcriber.
    expect(result.words).toBeUndefined();
  });
});
