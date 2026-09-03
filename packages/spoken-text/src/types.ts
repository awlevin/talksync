/** A single word with the time range in which it is spoken. */
export type SpokenWord = {
  text: string;
  /** Seconds from the start of the audio. */
  start: number;
  /** Seconds from the start of the audio. */
  end: number;
};

/** Audio plus the word timings that go with it. */
export type Alignment = {
  audioUrl: string;
  words: SpokenWord[];
  /** Total length in seconds, if the aligner reported one. */
  duration?: number;
};

/** Where a word sits relative to the playhead. */
export type WordState = "past" | "current" | "future";

/** One rendered word, as handed to `renderWord`. */
export type DisplayWord = {
  /** The word exactly as it appeared in the source text. */
  text: string;
  index: number;
  state: WordState;
  /** True when this word has a timestamp. Words in a block that has not been
   * fetched yet are untimed, and clicking one fetches that block. */
  seekable: boolean;
  /** Seconds from the start of the document, not of the block. */
  start?: number;
  end?: number;
};

/**
 * What kind of block a passage came from. It travels with the text so a voice
 * can read a heading like a heading instead of like the sentence after it.
 */
export type BlockKind = "heading" | "paragraph" | "list" | "quote";

/** Turn text into audio + word timings. Replaces the default `endpoint` POST. */
export type FetchAlignment = (
  text: string,
  context: { kind: BlockKind },
) => Promise<Alignment>;

export type SpokenTextStatus = "idle" | "loading" | "ready" | "error";

/** How far one block has got. `"idle"` means it has not been asked for yet. */
export type SegmentStatus = SpokenTextStatus;

/**
 * One block of the document — a heading, a paragraph, a list item — over the
 * controller's global word list.
 */
export type SpokenSegment = {
  /** Index of this block's first word. */
  start: number;
  /** One past this block's last word. */
  end: number;
  /** What the block is, as the voice was told to read it. */
  kind: BlockKind;
  status: SegmentStatus;
};

/** Everything needed to drive playback and render highlighting. */
export type SpokenTextController = {
  text: string;
  words: DisplayWord[];
  /** An index into `words`, across the whole document. `-1` before anything is said. */
  currentWordIndex: number;
  currentWord: DisplayWord | undefined;
  /** The blocks the document is read in, in order. */
  segments: SpokenSegment[];

  status: SpokenTextStatus;
  isLoading: boolean;
  isPlaying: boolean;
  error: Error | undefined;

  currentTime: number;
  duration: number;
  /**
   * True while `duration` still counts unloaded blocks at an estimated pace.
   * It settles as their audio lands.
   */
  durationIsEstimate: boolean;
  audioUrl: string | undefined;

  play: () => void;
  pause: () => void;
  toggle: () => void;
  /** Seek to an absolute time in seconds, anywhere in the document. */
  seek: (seconds: number) => void;
  /** Seek to a word and play from there, fetching its block if need be. */
  seekToWord: (index: number) => void;
  /** Seek to a 0-1 position in the document. */
  seekToFraction: (fraction: number) => void;

  /** The `Audio` element driving playback, for anything the API misses. */
  getAudioElement: () => HTMLAudioElement | null;
};

export type SpokenTextOptions = {
  /** API route that accepts `{ content }` and returns audio + word timings. */
  endpoint?: string;
  /** Bypass `endpoint` entirely and resolve the alignment yourself. */
  fetchAlignment?: FetchAlignment;
  /** Called whenever the spoken word changes. `-1` means nothing is spoken yet. */
  onWordChange?: (index: number, word: DisplayWord | undefined) => void;
  /** Wait this long after the text stops changing before fetching. Default `0`. */
  debounceMs?: number;
  /** Start speaking as soon as the audio is ready. Default `false`. */
  autoPlay?: boolean;
};
