import type { SpokenWord } from "../types.js";

/**
 * Real `whisper-1` output, captured from the deployed `/api/transcription`
 * route at https://talksync-six.vercel.app — the same `tts-1` -> `whisper-1`
 * round trip the app runs. Timings are verbatim; nothing here is invented.
 */
export type Fixture = {
  /** The text as it was typed, and as it is rendered. */
  text: string;
  /** The transcript Whisper returned for the generated audio. */
  transcript: string;
  durationInSeconds: number;
  words: SpokenWord[];
};

export const stateOfTheArt: Fixture = {
  text: "State-of-the-art tools cost $1,200 per seat, e.g. Figma or Sketch.",
  transcript: "State-of-the-art tools cost $1,200 per seat, e.g. Figma or Sketch.",
  durationInSeconds: 4.77,
  words: [
    { text: "State", start: 0.00, end: 0.32 },
    { text: "of", start: 0.32, end: 0.34 },
    { text: "the", start: 0.34, end: 0.54 },
    { text: "art", start: 0.54, end: 0.72 },
    { text: "tools", start: 0.72, end: 0.98 },
    { text: "cost", start: 0.98, end: 1.34 },
    { text: "1", start: 1.34, end: 1.68 },
    { text: "200", start: 1.68, end: 1.98 },
    { text: "per", start: 1.98, end: 2.48 },
    { text: "seat", start: 2.48, end: 2.72 },
    { text: "e", start: 2.96, end: 3.00 },
    { text: "g", start: 3.00, end: 3.10 },
    { text: "Figma", start: 3.30, end: 3.42 },
    { text: "or", start: 3.42, end: 3.80 },
    { text: "Sketch", start: 3.80, end: 4.16 },
  ],
};

export const nineteenSixtyNine: Fixture = {
  text: "In 1969 the company employed over 400,000 employees.",
  transcript: "In 1969, the company employed over 400,000 employees.",
  durationInSeconds: 4.60,
  words: [
    { text: "In", start: 0.00, end: 0.24 },
    { text: "1969", start: 0.24, end: 1.22 },
    { text: "the", start: 1.40, end: 1.52 },
    { text: "company", start: 1.52, end: 1.76 },
    { text: "employed", start: 1.76, end: 2.18 },
    { text: "over", start: 2.18, end: 2.46 },
    { text: "400", start: 2.46, end: 3.08 },
    { text: "000", start: 3.08, end: 3.60 },
    { text: "employees", start: 3.60, end: 4.10 },
  ],
};

export const doctorSmith: Fixture = {
  text: "Dr. Smith arrives at 3:45 p.m.",
  transcript: "Dr. Smith arrives at 345 p.m.",
  durationInSeconds: 2.42,
  words: [
    { text: "Dr", start: 0.00, end: 0.32 },
    { text: "Smith", start: 0.50, end: 0.60 },
    { text: "arrives", start: 0.60, end: 0.98 },
    { text: "at", start: 0.98, end: 1.16 },
    { text: "345", start: 1.16, end: 1.86 },
    { text: "p", start: 1.86, end: 2.04 },
    { text: "m", start: 2.04, end: 2.28 },
  ],
};

export const plainProse: Fixture = {
  text: "The tide came in slowly that morning, and the boats leaned over in the mud until the water found them again.",
  transcript: "The tide came in slowly that morning, and the boats leaned over in the mud until the water found them again.",
  durationInSeconds: 6.76,
  words: [
    { text: "The", start: 0.00, end: 0.46 },
    { text: "tide", start: 0.46, end: 0.48 },
    { text: "came", start: 0.48, end: 0.78 },
    { text: "in", start: 0.78, end: 1.06 },
    { text: "slowly", start: 1.06, end: 1.30 },
    { text: "that", start: 1.30, end: 1.60 },
    { text: "morning", start: 1.60, end: 1.88 },
    { text: "and", start: 2.34, end: 2.38 },
    { text: "the", start: 2.38, end: 2.80 },
    { text: "boats", start: 2.80, end: 2.80 },
    { text: "leaned", start: 2.80, end: 3.12 },
    { text: "over", start: 3.12, end: 3.46 },
    { text: "in", start: 3.46, end: 3.56 },
    { text: "the", start: 3.56, end: 3.98 },
    { text: "mud", start: 3.98, end: 3.98 },
    { text: "until", start: 3.98, end: 4.48 },
    { text: "the", start: 4.48, end: 4.74 },
    { text: "water", start: 4.74, end: 4.92 },
    { text: "found", start: 4.92, end: 5.16 },
    { text: "them", start: 5.16, end: 5.34 },
    { text: "again", start: 5.34, end: 5.60 },
  ],
};

export const singleWord: Fixture = {
  text: "Hello",
  transcript: "Hello!",
  durationInSeconds: 0.45,
  words: [
    { text: "Hello", start: 0.00, end: 0.24 },
  ],
};
