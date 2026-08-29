import type { Alignment, FetchAlignment } from "./types";

export const DEFAULT_ENDPOINT = "/api/transcription";

/** Wire format of the bundled `/api/transcription` route. */
type TranscriptionResponse = {
  audioUrl: string;
  transcription: {
    durationInSeconds?: number;
    words: { text: string; startSecond: number; endSecond: number }[];
  };
};

/**
 * The default aligner: POST `{ content }` to `endpoint`, expect audio and
 * word-level timestamps back. Swap it out with the `fetchAlignment` option
 * if your backend speaks a different shape.
 */
export const createEndpointAligner =
  (endpoint: string = DEFAULT_ENDPOINT): FetchAlignment =>
  async (text: string): Promise<Alignment> => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    if (!res.ok) {
      throw new Error(`Alignment request failed: ${res.status}`);
    }
    const body: TranscriptionResponse = await res.json();
    return {
      audioUrl: body.audioUrl,
      duration: body.transcription?.durationInSeconds,
      words: (body.transcription?.words ?? []).map((w) => ({
        text: w.text,
        start: w.startSecond,
        end: w.endSecond,
      })),
    };
  };
