import type { SpokenWord } from "./types.js";

/**
 * The stretch of audio in which one display token is spoken, plus the
 * transcript words it was matched to.
 */
export type SpokenSpan = {
  /** Seconds from the start of the audio. */
  start: number;
  /** Seconds from the start of the audio. */
  end: number;
  /** Indices into the transcript word list, in order, covered by this token. */
  words: number[];
};

/** Whitespace, ASCII punctuation and symbols, and the Unicode punctuation blocks. */
const NON_WORD =
  /[\s!-/:-@[-`{-~\u00a0-\u00bf\u2000-\u206f\u2e00-\u2e7f]+/g;

/** Combining accents left behind by NFKD. */
const COMBINING = /[\u0300-\u036f]+/g;

/**
 * Reduce a token to the letters and digits it is made of, for comparison only.
 * The original string is what gets rendered.
 *
 * `"State-of-the-art"` and `"State of the art"` both collapse to
 * `"stateoftheart"`; `"$1,200"` and `"1" + "200"` both collapse to `"1200"`.
 */
export const normalizeForAlignment = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING, "")
    .replace(NON_WORD, "");

/**
 * How many entries one side of a group may consume. `State-of-the-art` needs
 * four; nothing sane needs sixteen, and the cap keeps a pathological input from
 * swallowing the whole passage.
 */
const MAX_GROUP = 16;

/** How far ahead either side may be searched for a fresh anchor after a mismatch. */
const RESYNC_WINDOW = 8;

type Group = { tokenEnd: number; wordEnd: number };

/**
 * Try to grow a group starting at `i` / `j` until both sides spell the same
 * thing. Grows whichever side is currently shorter, and gives up the moment
 * neither side is a prefix of the other — so a group is only ever returned on
 * an exact match of the normalized text.
 */
const growGroup = (
  tokens: string[],
  words: string[],
  i: number,
  j: number,
): Group | undefined => {
  let tokenEnd = i + 1;
  let wordEnd = j + 1;
  let left = tokens[i];
  let right = words[j];

  while (left !== right) {
    if (!left.startsWith(right) && !right.startsWith(left)) return undefined;

    if (left.length > right.length) {
      if (wordEnd >= words.length || wordEnd - j >= MAX_GROUP) return undefined;
      right += words[wordEnd];
      wordEnd += 1;
    } else {
      if (tokenEnd >= tokens.length || tokenEnd - i >= MAX_GROUP) {
        return undefined;
      }
      left += tokens[tokenEnd];
      tokenEnd += 1;
    }
  }

  return { tokenEnd, wordEnd };
};

/**
 * After a mismatch, look for the nearest pair of positions that does match,
 * preferring the smallest total skip. Anything skipped on the way is simply
 * left untimed.
 */
const findAnchor = (
  tokens: string[],
  words: string[],
  i: number,
  j: number,
): { i: number; j: number } | undefined => {
  for (let distance = 1; distance <= RESYNC_WINDOW * 2; distance += 1) {
    const first = Math.max(0, distance - RESYNC_WINDOW);
    const last = Math.min(distance, RESYNC_WINDOW);
    for (let skipTokens = first; skipTokens <= last; skipTokens += 1) {
      const skipWords = distance - skipTokens;
      const nextI = i + skipTokens;
      const nextJ = j + skipWords;
      if (nextI >= tokens.length || nextJ >= words.length) continue;
      if (growGroup(tokens, words, nextI, nextJ)) return { i: nextI, j: nextJ };
    }
  }
  return undefined;
};

/**
 * Pair the tokens you render with the words a transcriber heard.
 *
 * The two lists rarely line up one for one: `State-of-the-art` is one token but
 * four transcript words, `$1,200` is one token but two, and a compound the
 * transcriber runs together is one word but two tokens. So this walks both
 * sides at once, growing whichever side is behind until the two spell the same
 * letters and digits, and resynchronising at the next agreement when they
 * disagree.
 *
 * A span is only ever assigned on an exact match of the normalized text, so a
 * token that cannot be matched comes back `undefined` rather than wrong.
 *
 * @returns One entry per token in `tokens`, in the same order.
 */
export const alignTokens = (
  tokens: readonly string[],
  spoken: readonly SpokenWord[],
): (SpokenSpan | undefined)[] => {
  const spans: (SpokenSpan | undefined)[] = new Array(tokens.length).fill(
    undefined,
  );
  if (tokens.length === 0 || spoken.length === 0) return spans;

  // Punctuation-only entries normalize to nothing and can never be matched, so
  // drop them from the walk instead of letting them cause a mismatch.
  const tokenIndices: number[] = [];
  const normalizedTokens: string[] = [];
  tokens.forEach((token, index) => {
    const normalized = normalizeForAlignment(token);
    if (normalized === "") return;
    tokenIndices.push(index);
    normalizedTokens.push(normalized);
  });

  const wordIndices: number[] = [];
  const normalizedWords: string[] = [];
  spoken.forEach((word, index) => {
    const normalized = normalizeForAlignment(word.text);
    if (normalized === "") return;
    wordIndices.push(index);
    normalizedWords.push(normalized);
  });

  let i = 0;
  let j = 0;

  while (i < normalizedTokens.length && j < normalizedWords.length) {
    const group = growGroup(normalizedTokens, normalizedWords, i, j);

    if (!group) {
      const anchor = findAnchor(normalizedTokens, normalizedWords, i, j);
      if (anchor) {
        i = anchor.i;
        j = anchor.j;
      } else {
        // Nothing agrees within the window. Step both sides so the walk still
        // terminates, and leave the tokens we pass over untimed.
        i += 1;
        j += 1;
      }
      continue;
    }

    const words = wordIndices.slice(j, group.wordEnd);
    const start = spoken[words[0]].start;
    const end = spoken[words[words.length - 1]].end;

    for (let k = i; k < group.tokenEnd; k += 1) {
      spans[tokenIndices[k]] = { start, end: Math.max(start, end), words };
    }

    i = group.tokenEnd;
    j = group.wordEnd;
  }

  return spans;
};

/**
 * The token being spoken at `time`: the last one whose span has started.
 * Tokens the aligner could not place are skipped rather than guessed at, and
 * the result is always a valid index into `spans` or `-1`.
 */
export const tokenIndexAt = (
  spans: readonly (SpokenSpan | undefined)[],
  time: number,
): number => {
  let found = -1;
  for (let i = 0; i < spans.length; i += 1) {
    const span = spans[i];
    if (span && span.start <= time) found = i;
  }
  return found;
};
