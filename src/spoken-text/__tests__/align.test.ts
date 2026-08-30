import { describe, expect, it } from "vitest";
import { alignTokens, normalizeForAlignment, tokenIndexAt } from "../align";
import { tokenize } from "../tokenize";
import type { SpokenWord } from "../types";
import {
  doctorSmith,
  nineteenSixtyNine,
  plainProse,
  singleWord,
  stateOfTheArt,
  type Fixture,
} from "./fixtures";

/**
 * What a reader would check by ear: for each rendered token, which transcript
 * words it was matched to and the seconds it spans.
 */
const mapping = (fixture: Fixture) => {
  const tokens = tokenize(fixture.text).words;
  return alignTokens(tokens, fixture.words).map((span, index) => [
    tokens[index],
    span ? span.words.map((w) => fixture.words[w].text).join(" ") : null,
    span ? [span.start, span.end] : null,
  ]);
};

describe("normalizeForAlignment", () => {
  it("keeps only letters and digits, casefolded", () => {
    expect(normalizeForAlignment("State-of-the-art")).toBe("stateoftheart");
    expect(normalizeForAlignment("$1,200")).toBe("1200");
    expect(normalizeForAlignment("e.g.")).toBe("eg");
    expect(normalizeForAlignment("p.m.")).toBe("pm");
    expect(normalizeForAlignment("3:45")).toBe("345");
    expect(normalizeForAlignment("seat,")).toBe("seat");
    expect(normalizeForAlignment("“quoted”—yes")).toBe(
      "quotedyes",
    );
  });

  it("folds accents so a transcript may spell them either way", () => {
    expect(normalizeForAlignment("café")).toBe(
      normalizeForAlignment("cafe"),
    );
  });

  it("returns nothing for punctuation on its own", () => {
    expect(normalizeForAlignment("—")).toBe("");
    expect(normalizeForAlignment("...")).toBe("");
  });
});

describe("alignTokens - the sentences that used to drift", () => {
  it("splits one token across the several words Whisper heard", () => {
    // 10 rendered tokens, 15 Whisper words.
    expect(tokenize(stateOfTheArt.text).words).toHaveLength(10);
    expect(stateOfTheArt.words).toHaveLength(15);

    expect(mapping(stateOfTheArt)).toEqual([
      ["State-of-the-art", "State of the art", [0, 0.72]],
      ["tools", "tools", [0.72, 0.98]],
      ["cost", "cost", [0.98, 1.34]],
      ["$1,200", "1 200", [1.34, 1.98]],
      ["per", "per", [1.98, 2.48]],
      ["seat,", "seat", [2.48, 2.72]],
      ["e.g.", "e g", [2.96, 3.1]],
      ["Figma", "Figma", [3.3, 3.42]],
      ["or", "or", [3.42, 3.8]],
      ["Sketch.", "Sketch", [3.8, 4.16]],
    ]);
  });

  it("joins the digit groups Whisper split apart", () => {
    expect(tokenize(nineteenSixtyNine.text).words).toHaveLength(8);
    expect(nineteenSixtyNine.words).toHaveLength(9);

    expect(mapping(nineteenSixtyNine)).toEqual([
      ["In", "In", [0, 0.24]],
      ["1969", "1969", [0.24, 1.22]],
      ["the", "the", [1.4, 1.52]],
      ["company", "company", [1.52, 1.76]],
      ["employed", "employed", [1.76, 2.18]],
      ["over", "over", [2.18, 2.46]],
      ["400,000", "400 000", [2.46, 3.6]],
      ["employees.", "employees", [3.6, 4.1]],
    ]);
  });

  it("handles abbreviations Whisper breaks into letters", () => {
    expect(tokenize(doctorSmith.text).words).toHaveLength(6);
    expect(doctorSmith.words).toHaveLength(7);

    expect(mapping(doctorSmith)).toEqual([
      ["Dr.", "Dr", [0, 0.32]],
      ["Smith", "Smith", [0.5, 0.6]],
      ["arrives", "arrives", [0.6, 0.98]],
      ["at", "at", [0.98, 1.16]],
      ["3:45", "345", [1.16, 1.86]],
      ["p.m.", "p m", [1.86, 2.28]],
    ]);
  });

  it("no longer runs the highlight ahead of the voice", () => {
    const tokens = tokenize(stateOfTheArt.text).words;
    const spans = alignTokens(tokens, stateOfTheArt.words);

    // At 2.0s Whisper is on "per"; at 2.6s it is on "seat,". The old
    // index-pairing put "Sketch." under the playhead by 2s and nothing at all
    // by 4s, because the 10 tokens were zipped against 15 words.
    expect(tokens[tokenIndexAt(spans, 2.0)]).toBe("per");
    expect(tokens[tokenIndexAt(spans, 2.6)]).toBe("seat,");
    expect(tokens[tokenIndexAt(spans, 3.35)]).toBe("Figma");
    expect(tokens[tokenIndexAt(spans, 4.0)]).toBe("Sketch.");
  });

  it("never points past the last rendered token", () => {
    const tokens = tokenize(stateOfTheArt.text).words;
    const spans = alignTokens(tokens, stateOfTheArt.words);
    for (let t = 0; t <= 10; t += 0.05) {
      const index = tokenIndexAt(spans, t);
      expect(index).toBeGreaterThanOrEqual(-1);
      expect(index).toBeLessThan(tokens.length);
    }
    // Well past the end of the audio it rests on the final token, never off it.
    expect(tokenIndexAt(spans, 60)).toBe(tokens.length - 1);
  });
});

describe("alignTokens - plain prose", () => {
  it("pairs one to one, exactly as the naive index pairing did", () => {
    const tokens = tokenize(plainProse.text).words;
    expect(tokens).toHaveLength(plainProse.words.length);

    const spans = alignTokens(tokens, plainProse.words);
    spans.forEach((span, index) => {
      expect(span).toEqual({
        start: plainProse.words[index].start,
        end: plainProse.words[index].end,
        words: [index],
      });
    });
  });

  it("aligns a single word", () => {
    expect(mapping(singleWord)).toEqual([["Hello", "Hello", [0, 0.24]]]);
  });
});

describe("tokenize - what gets rendered", () => {
  it("puts the text back together byte for byte", () => {
    const text =
      "  Two   spaces.\nA new line.\n\n  Indented, and a trailing space. ";
    const { lead, words, separators } = tokenize(text);
    expect(lead + words.map((w, i) => w + separators[i]).join("")).toBe(text);
  });

  it("keeps newlines out of the words themselves", () => {
    const { words } = tokenize("First line\nsecond line");
    expect(words).toEqual(["First", "line", "second", "line"]);
  });

  it("aligns across line breaks, which are whitespace to Whisper", () => {
    const text = "The tide came in\nslowly that morning,";
    const tokens = tokenize(text).words;
    const spans = alignTokens(tokens, plainProse.words.slice(0, 7));
    expect(spans.map((s) => s?.start)).toEqual([
      0, 0.46, 0.48, 0.78, 1.06, 1.3, 1.6,
    ]);
  });
});

describe("alignTokens - degenerate input", () => {
  const noWords: SpokenWord[] = [];

  it("survives an empty passage", () => {
    expect(alignTokens(tokenize("").words, plainProse.words)).toEqual([]);
    expect(alignTokens([], noWords)).toEqual([]);
  });

  it("survives a passage with no transcript at all", () => {
    const tokens = tokenize("Nothing came back.").words;
    expect(alignTokens(tokens, noWords)).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("times what it can when Whisper stops early", () => {
    const tokens = tokenize(plainProse.text).words;
    const truncated = plainProse.words.slice(0, 7);
    const spans = alignTokens(tokens, truncated);

    expect(spans.slice(0, 7).every((s) => s !== undefined)).toBe(true);
    expect(spans.slice(7).every((s) => s === undefined)).toBe(true);
    expect(spans).toHaveLength(tokens.length);
  });

  it("skips a token Whisper dropped and picks the thread back up", () => {
    const tokens = tokenize(plainProse.text).words;
    // Whisper misses "slowly" (index 4) entirely.
    const dropped = plainProse.words.filter((_, i) => i !== 4);
    const spans = alignTokens(tokens, dropped);

    expect(spans[4]).toBeUndefined();
    expect(spans[3]).toEqual({
      start: plainProse.words[3].start,
      end: plainProse.words[3].end,
      words: [3],
    });
    // Everything after the gap is still correct, not shifted by one.
    expect(spans[5]?.start).toBe(plainProse.words[5].start);
    expect(spans[20]?.start).toBe(plainProse.words[20].start);
    expect(tokens[20]).toBe("again.");
  });

  it("skips a word Whisper invented and picks the thread back up", () => {
    const tokens = tokenize(plainProse.text).words;
    const extra: SpokenWord[] = [
      ...plainProse.words.slice(0, 5),
      { text: "umm", start: 1.3, end: 1.31 },
      ...plainProse.words.slice(5),
    ];
    const spans = alignTokens(tokens, extra);

    expect(spans.every((s) => s !== undefined)).toBe(true);
    expect(spans[5]?.start).toBe(plainProse.words[5].start);
    expect(spans[20]?.start).toBe(plainProse.words[20].start);
  });

  it("merges several tokens onto one word Whisper ran together", () => {
    const tokens = tokenize("A peanut butter jar.").words;
    const spans = alignTokens(tokens, [
      { text: "A", start: 0, end: 0.2 },
      { text: "peanutbutter", start: 0.2, end: 1.0 },
      { text: "jar", start: 1.0, end: 1.4 },
    ]);

    expect(spans[1]).toEqual({ start: 0.2, end: 1.0, words: [1] });
    expect(spans[2]).toEqual({ start: 0.2, end: 1.0, words: [1] });
    expect(spans[3]).toEqual({ start: 1.0, end: 1.4, words: [2] });
  });

  it("leaves a punctuation-only token untimed without losing its place", () => {
    const tokens = tokenize("Yes — really.").words;
    expect(tokens).toEqual(["Yes", "—", "really."]);

    const spans = alignTokens(tokens, [
      { text: "Yes", start: 0, end: 0.3 },
      { text: "really", start: 0.4, end: 0.9 },
    ]);
    expect(spans[0]).toEqual({ start: 0, end: 0.3, words: [0] });
    expect(spans[1]).toBeUndefined();
    expect(spans[2]).toEqual({ start: 0.4, end: 0.9, words: [1] });
  });

  it("gives up quietly when the transcript is unrelated", () => {
    const tokens = tokenize("One two three four.").words;
    const spans = alignTokens(tokens, [
      { text: "completely", start: 0, end: 0.5 },
      { text: "different", start: 0.5, end: 1.0 },
    ]);
    expect(spans).toHaveLength(4);
    expect(spans.every((s) => s === undefined)).toBe(true);
    expect(tokenIndexAt(spans, 0.75)).toBe(-1);
  });

  it("never assigns a span that ends before it starts", () => {
    for (const fixture of [
      stateOfTheArt,
      nineteenSixtyNine,
      doctorSmith,
      plainProse,
      singleWord,
    ]) {
      const tokens = tokenize(fixture.text).words;
      for (const span of alignTokens(tokens, fixture.words)) {
        if (span) expect(span.end).toBeGreaterThanOrEqual(span.start);
      }
    }
  });
});
