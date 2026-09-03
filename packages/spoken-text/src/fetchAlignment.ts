import type { Alignment, BlockKind, FetchAlignment } from "./types.js";

export const DEFAULT_ENDPOINT = "/api/transcription";

/** The wire format `createAlignmentHandler` returns. */
type AlignmentResponse = {
  audioUrl: string;
  duration?: number;
  words: { text: string; start: number; end: number }[];
};

const errorFrom = async (res: Response): Promise<Error> => {
  try {
    const body = (await res.json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error) {
      return new Error(body.error);
    }
  } catch {
    // The route did not answer with JSON. The status is all we have.
  }
  return new Error(`Alignment request failed: ${res.status}`);
};

/**
 * The default aligner: POST `{ content, kind }` to `endpoint`, expect audio
 * and word-level timestamps back. Swap it out with the `fetchAlignment` option
 * if your backend speaks a different shape.
 */
export const createEndpointAligner =
  (endpoint: string = DEFAULT_ENDPOINT): FetchAlignment =>
  async (text: string, context: { kind: BlockKind }): Promise<Alignment> => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, kind: context.kind }),
    });
    if (!res.ok) throw await errorFrom(res);

    const body = (await res.json()) as AlignmentResponse;
    return {
      audioUrl: body.audioUrl,
      duration: body.duration,
      words: (body.words ?? []).map((w) => ({
        text: w.text,
        start: w.start,
        end: w.end,
      })),
    };
  };
