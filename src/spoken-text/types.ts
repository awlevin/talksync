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
  /** True when this word has a timestamp, so it can be clicked to seek. */
  seekable: boolean;
  start?: number;
  end?: number;
};

/** Turn text into audio + word timings. Replaces the default `endpoint` POST. */
export type FetchAlignment = (text: string) => Promise<Alignment>;

export type SpokenTextStatus = "idle" | "loading" | "ready" | "error";

/** Everything needed to drive playback and render highlighting. */
export type SpokenTextController = {
  text: string;
  words: DisplayWord[];
  currentWordIndex: number;
  currentWord: DisplayWord | undefined;

  status: SpokenTextStatus;
  isLoading: boolean;
  isPlaying: boolean;
  error: Error | undefined;

  currentTime: number;
  duration: number;
  audioUrl: string | undefined;

  play: () => void;
  pause: () => void;
  toggle: () => void;
  /** Seek to an absolute time in seconds. */
  seek: (seconds: number) => void;
  /** Seek to the start of a word and play from there. */
  seekToWord: (index: number) => void;
  /** Seek to a 0-1 position in the audio. */
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
  /** Wait this long after `text` stops changing before fetching. Default `0`. */
  debounceMs?: number;
  /** Start speaking as soon as the audio is ready. Default `false`. */
  autoPlay?: boolean;
};
