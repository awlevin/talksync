"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { alignTokens, tokenIndexAt, type SpokenSpan } from "./align.js";
import {
  alignmentKey,
  loadAlignment,
  peekAlignment,
} from "./alignmentCache.js";
import {
  documentSignature,
  EMPTY_DOCUMENT,
  type SpokenDocument,
} from "./document.js";
import { createEndpointAligner, DEFAULT_ENDPOINT } from "./fetchAlignment.js";
import type {
  Alignment,
  DisplayWord,
  SegmentStatus,
  SpokenSegment,
  SpokenTextController,
  SpokenTextOptions,
} from "./types.js";

/**
 * Highlight a word slightly before it is spoken, so the eye arrives with the
 * voice rather than behind it.
 */
const LOOKAHEAD_SECONDS = 0.35;

/**
 * Roughly the pace `tts-1` reads English at. Only ever used to estimate a
 * block whose audio has not landed, so the scrubber has a length to work with.
 */
const WORDS_PER_SECOND = 2.7;

/** Chrome and Safari ignore `currentTime` until the metadata has landed. */
const HAVE_METADATA = 1;

/** What is known about one block's audio. */
type Load = { status: SegmentStatus; alignment?: Alignment; error?: Error };

const IDLE: Load = { status: "idle" };

/**
 * A seek that cannot be honoured yet, because the block it lands in has not
 * been fetched. `word` resolves to a time once the block's timings arrive.
 */
type Intent = {
  segment: number;
  time?: number;
  word?: number;
  play: boolean;
};

const asError = (cause: unknown): Error =>
  cause instanceof Error ? cause : new Error(String(cause));

const useDebounced = <T,>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    if (delay <= 0) {
      setDebounced(value);
      return;
    }
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return delay <= 0 ? value : debounced;
};

/**
 * Hold one object for as long as the document says the same thing, so the
 * effects below are not restarted by a parent that re-rendered.
 */
export const useStableDocument = (document: SpokenDocument): SpokenDocument => {
  const signature = documentSignature(document);
  const held = useRef({ signature, document });
  if (held.current.signature !== signature) {
    held.current = { signature, document };
  }
  return held.current.document;
};

/**
 * Playback and highlighting for a document read one block at a time.
 *
 * Every word is tokenized on mount and addressed by a single index across the
 * whole document. Each block aligns independently: the first is fetched
 * straight away, the next is warmed while the current one plays, and a word in
 * a block that has not landed is untimed until it does. `duration` counts
 * those blocks at an estimated pace and corrects itself as they arrive.
 *
 * `document` must keep its identity while it says the same thing — see
 * `useStableDocument`.
 */
export const useSpokenDocument = (
  document: SpokenDocument | null | undefined,
  options: SpokenTextOptions = {},
): SpokenTextController => {
  const {
    endpoint = DEFAULT_ENDPOINT,
    fetchAlignment,
    onWordChange,
    debounceMs = 0,
    autoPlay = false,
  } = options;

  const doc = document ?? EMPTY_DOCUMENT;

  // Rendering follows the document as it is now; only the request waits, so
  // typing behind a debounce is not held up on screen.
  const requested = useDebounced(doc, debounceMs);

  const keys = useMemo(
    () => requested.segments.map((s) => alignmentKey(endpoint, s.text, s.kind)),
    [requested, endpoint],
  );

  const [loads, setLoads] = useState<Record<string, Load>>({});

  /**
   * Resolving from the shared cache keeps a block that has already been spoken
   * from flashing its loading state again.
   */
  const loadOf = useCallback(
    (key: string | undefined): Load => {
      if (!key) return IDLE;
      const held = loads[key];
      if (held) return held;
      const cached = peekAlignment(key);
      return cached ? { status: "ready", alignment: cached } : IDLE;
    },
    [loads],
  );

  const requestedRef = useRef(requested);
  requestedRef.current = requested;
  const keysRef = useRef(keys);
  keysRef.current = keys;
  const alignerRef = useRef(fetchAlignment);
  alignerRef.current = fetchAlignment;

  // Blocks this hook has already asked for. The module cache dedupes across
  // components; this dedupes within one.
  const asked = useRef(new Set<string>());

  /**
   * Fetch one block, once. A block that failed stays failed until a reader
   * asks for it again — `retry` — so a route that is down is not hammered.
   */
  const ensure = useCallback(
    (index: number, retry = false) => {
      const key = keysRef.current[index];
      const segment = requestedRef.current.segments[index];
      if (!key || !segment) return;
      if (peekAlignment(key)) return;
      if (asked.current.has(key) && !retry) return;

      asked.current.add(key);
      setLoads((prev) => ({ ...prev, [key]: { status: "loading" } }));

      loadAlignment(key, () =>
        (alignerRef.current ?? createEndpointAligner(endpoint))(segment.text, {
          kind: segment.kind,
        }),
      ).then(
        (alignment) =>
          setLoads((prev) => ({ ...prev, [key]: { status: "ready", alignment } })),
        (cause: unknown) =>
          setLoads((prev) => ({
            ...prev,
            [key]: { status: "error", error: asError(cause) },
          })),
      );
    },
    [endpoint],
  );

  // ---------------------------------------------------------------- playback

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [segment, setSegment] = useState(0);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [localTime, setLocalTime] = useState(0);
  const [metaDuration, setMetaDuration] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);

  // A different document is a different reading. Start it at the top.
  useEffect(() => {
    setSegment(0);
    setIntent(null);
    setLocalTime(0);
    setCurrentWordIndex(-1);
  }, [requested]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const onPlay = () => setIsAudioPlaying(true);
    const onPause = () => setIsAudioPlaying(false);
    const onMeta = () =>
      setMetaDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onSeeked = () => setLocalTime(audio.currentTime);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("seeked", onSeeked);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("seeked", onSeeked);
      audio.pause();
      audio.removeAttribute("src");
      audioRef.current = null;
    };
  }, []);

  const active = loadOf(keys[segment]);
  const audioUrl = active.alignment?.audioUrl;

  const autoPlayRef = useRef(autoPlay);
  autoPlayRef.current = autoPlay;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setMetaDuration(0);
    setLocalTime(0);
    if (!audioUrl) {
      audio.pause();
      audio.removeAttribute("src");
      return;
    }
    audio.src = audioUrl;
    audio.load();
    if (autoPlayRef.current) void audio.play().catch(() => undefined);
  }, [audioUrl]);

  // The block being read is fetched, and the next one is warmed behind it, so
  // playback does not stall at the boundary.
  useEffect(() => {
    ensure(segment);
    if (active.status === "ready") ensure(segment + 1);
  }, [segment, active.status, ensure]);

  // The first block is fetched on mount, so the play button is live at once.
  useEffect(() => {
    ensure(0);
  }, [keys, ensure]);

  // ------------------------------------------------------------- the timeline

  const durations = useMemo(
    () =>
      doc.segments.map((s, index) => {
        const measured =
          index === segment && metaDuration > 0 ? metaDuration : undefined;
        const known = measured ?? loadOf(keys[index]).alignment?.duration;
        return known != null && known > 0
          ? { seconds: known, estimated: false }
          : {
              seconds: (s.end - s.start) / WORDS_PER_SECOND,
              estimated: true,
            };
      }),
    [doc, keys, loadOf, segment, metaDuration],
  );

  const offsets = useMemo(() => {
    let elapsed = 0;
    return durations.map((entry) => {
      const at = elapsed;
      elapsed += entry.seconds;
      return at;
    });
  }, [durations]);

  const duration = durations.reduce((total, entry) => total + entry.seconds, 0);
  const durationIsEstimate = durations.some((entry) => entry.estimated);

  // ------------------------------------------------------------- highlighting

  /**
   * One span per rendered token, in the time of its own block. The transcriber
   * does not split on whitespace, so each block's tokens are aligned against
   * its transcript rather than zipped — see `align.ts`.
   */
  const spans = useMemo<(SpokenSpan | undefined)[]>(() => {
    const all: (SpokenSpan | undefined)[] = new Array(doc.words.length).fill(
      undefined,
    );
    doc.segments.forEach((s, index) => {
      const timings = loadOf(keys[index]).alignment?.words;
      if (!timings?.length) return;
      try {
        alignTokens(doc.words.slice(s.start, s.end), timings).forEach(
          (span, offset) => {
            all[s.start + offset] = span;
          },
        );
      } catch {
        // Never take the document down over a timing problem: leave it unlit.
      }
    });
    return all;
  }, [doc, keys, loadOf]);

  const segmentOf = useMemo(() => {
    const owner = new Array<number>(doc.words.length).fill(0);
    doc.segments.forEach((s, index) => {
      for (let word = s.start; word < s.end; word += 1) owner[word] = index;
    });
    return owner;
  }, [doc]);

  const spansRef = useRef(spans);
  spansRef.current = spans;
  const segmentsRef = useRef(doc.segments);
  segmentsRef.current = doc.segments;
  const segmentOfRef = useRef(segmentOf);
  segmentOfRef.current = segmentOf;

  /**
   * Where in its own block a word is spoken. When it could not be placed —
   * punctuation, or a word the transcriber spelled differently — fall back to
   * the last word before it that was, so a click lands somewhere sensible
   * instead of restarting the block.
   */
  const timeOfWord = useCallback((index: number): number => {
    const block = segmentsRef.current[segmentOfRef.current[index] ?? 0];
    if (!block) return 0;
    for (let at = index; at >= block.start; at -= 1) {
      const span = spansRef.current[at];
      if (span) return span.start;
    }
    return 0;
  }, []);

  useEffect(() => {
    if (!isAudioPlaying) return;
    const block = doc.segments[segment];
    if (!block) return;
    const next = tokenIndexAt(
      spans.slice(block.start, block.end),
      localTime + LOOKAHEAD_SECONDS,
    );
    if (next !== -1) setCurrentWordIndex(block.start + next);
  }, [spans, isAudioPlaying, localTime, segment, doc]);

  // The index always points at a rendered token, even if the document shrank
  // out from under a stale highlight.
  const activeIndex =
    currentWordIndex >= 0 && currentWordIndex < doc.words.length
      ? currentWordIndex
      : -1;

  const words = useMemo<DisplayWord[]>(
    () =>
      doc.words.map((word, index) => {
        const span = spans[index];
        const offset = offsets[segmentOf[index]] ?? 0;
        return {
          text: word,
          index,
          state:
            index === activeIndex
              ? "current"
              : activeIndex >= 0 && index < activeIndex
                ? "past"
                : "future",
          seekable: !!span,
          start: span ? offset + span.start : undefined,
          end: span ? offset + span.end : undefined,
        };
      }),
    [doc, spans, offsets, segmentOf, activeIndex],
  );

  const currentWord = activeIndex >= 0 ? words[activeIndex] : undefined;

  const segments = useMemo<SpokenSegment[]>(
    () =>
      doc.segments.map((s, index) => ({
        start: s.start,
        end: s.end,
        kind: s.kind,
        status: loadOf(keys[index]).status,
      })),
    [doc, keys, loadOf],
  );

  const changeRef = useRef(onWordChange);
  changeRef.current = onWordChange;
  useEffect(() => {
    changeRef.current?.(activeIndex, currentWord);
    // Fire on index changes only — not on every re-render of the word list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  // ---------------------------------------------------------------- controls

  const isPlaying = isAudioPlaying || intent?.play === true;

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (audio?.getAttribute("src")) {
      void audio.play().catch(() => undefined);
      return;
    }
    // Nothing to play yet: remember the intent and let the block land first.
    setIntent({ segment, time: localTime, play: true });
    ensure(segment, true);
  }, [segment, localTime, ensure]);

  const pause = useCallback(() => {
    setIntent(null);
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const seek = useCallback(
    (seconds: number) => {
      if (!offsets.length) return;
      const at = Math.max(0, Math.min(duration, seconds));

      let target = 0;
      for (let index = 0; index < offsets.length; index += 1) {
        if (offsets[index] <= at) target = index;
      }
      const local = at - offsets[target];

      if (target !== segment) {
        setSegment(target);
        setIntent({ segment: target, time: local, play: isPlaying });
        return;
      }

      const audio = audioRef.current;
      if (!audio || !audioUrl) {
        setIntent({ segment: target, time: local, play: isPlaying });
        return;
      }
      const limit = Number.isFinite(audio.duration) ? audio.duration : local;
      const next = Math.max(0, Math.min(limit, local));
      audio.currentTime = next;
      setLocalTime(next);
    },
    [offsets, duration, segment, audioUrl, isPlaying],
  );

  const seekToWord = useCallback(
    (index: number) => {
      const target = segmentOf[index];
      if (target == null || !doc.segments[target]) return;

      setCurrentWordIndex(index);
      ensure(target, true);

      const audio = audioRef.current;
      if (target === segment && audioUrl && audio) {
        const at = timeOfWord(index);
        audio.currentTime = at;
        setLocalTime(at);
        void audio.play().catch(() => undefined);
        return;
      }

      // The block has not been fetched, or is not the one loaded: ask for it
      // and play from this word as soon as it lands.
      setSegment(target);
      setIntent({ segment: target, word: index, play: true });
    },
    [segmentOf, doc, segment, audioUrl, ensure, timeOfWord],
  );

  // A seek that was waiting on a block is honoured once that block can be
  // seeked, which is not until the browser has its metadata.
  useEffect(() => {
    if (!intent || intent.segment !== segment) return;
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const apply = () => {
      const at = intent.word != null ? timeOfWord(intent.word) : (intent.time ?? 0);
      setIntent(null);
      audio.currentTime = at;
      setLocalTime(at);
      if (intent.play) void audio.play().catch(() => undefined);
    };

    if (audio.readyState >= HAVE_METADATA) {
      apply();
      return;
    }
    audio.addEventListener("loadedmetadata", apply, { once: true });
    return () => audio.removeEventListener("loadedmetadata", apply);
  }, [intent, segment, audioUrl, timeOfWord]);

  // The end of a block is not the end of the document.
  const count = doc.segments.length;
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      if (segment + 1 < count) {
        setSegment(segment + 1);
        setIntent({ segment: segment + 1, time: 0, play: true });
      } else {
        setIsAudioPlaying(false);
      }
    };
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [segment, count]);

  // Follow the playhead only while it is moving.
  useEffect(() => {
    if (!isAudioPlaying) return;
    let frame = 0;
    const tick = () => {
      const audio = audioRef.current;
      if (audio) setLocalTime(audio.currentTime);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isAudioPlaying]);

  const seekToFraction = useCallback(
    (fraction: number) => {
      if (!duration) return;
      seek(Math.max(0, Math.min(1, fraction)) * duration);
    },
    [duration, seek],
  );

  const getAudioElement = useCallback(() => audioRef.current, []);

  // The block being read has always been asked for, so an idle one is a block
  // the effect above is about to request rather than one nobody wants.
  const pendingFirst = active.status === "idle" && !!keys[segment];
  const status =
    active.status === "error"
      ? "error"
      : active.status === "loading" || pendingFirst
        ? "loading"
        : active.alignment
          ? "ready"
          : "idle";

  return {
    text: doc.text,
    words,
    currentWordIndex: activeIndex,
    currentWord,
    segments,
    status,
    isLoading: status === "loading",
    isPlaying,
    error: active.error,
    currentTime: (offsets[segment] ?? 0) + localTime,
    duration,
    durationIsEstimate,
    audioUrl,
    play,
    pause,
    toggle,
    seek,
    seekToWord,
    seekToFraction,
    getAudioElement,
  };
};
