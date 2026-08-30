"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { alignTokens, tokenIndexAt, type SpokenSpan } from "./align";
import { createEndpointAligner, DEFAULT_ENDPOINT } from "./fetchAlignment";
import { tokenize } from "./tokenize";
import type {
  Alignment,
  DisplayWord,
  SpokenTextController,
  SpokenTextOptions,
} from "./types";

/**
 * Highlight a word slightly before it is spoken, so the eye arrives with the
 * voice rather than behind it.
 */
const LOOKAHEAD_SECONDS = 0.35;

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
 * Headless speech + highlighting. Pass `null` to switch it off.
 *
 * ```tsx
 * const speech = useSpokenText("Any text you like.");
 * <button onClick={speech.toggle}>{speech.isPlaying ? "Pause" : "Play"}</button>
 * ```
 */
export const useSpokenText = (
  text: string | null | undefined,
  options: SpokenTextOptions = {},
): SpokenTextController => {
  const {
    endpoint = DEFAULT_ENDPOINT,
    fetchAlignment,
    onWordChange,
    debounceMs = 0,
    autoPlay = false,
  } = options;

  const source = text ?? "";
  const debounced = useDebounced(source.trim(), debounceMs);

  const alignerRef = useRef<SpokenTextOptions["fetchAlignment"]>(undefined);
  alignerRef.current = fetchAlignment;

  const { data, error, isLoading } = useSWR<Alignment>(
    text != null && debounced ? ["spoken-text", endpoint, debounced] : null,
    ([, url, content]: [string, string, string]) =>
      (alignerRef.current ?? createEndpointAligner(url))(content),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60_000,
    },
  );

  // ---------------------------------------------------------------- playback

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const onPlay = () => setIsPlaying(true);
    const onStop = () => setIsPlaying(false);
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onSeeked = () => setCurrentTime(audio.currentTime);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onStop);
    audio.addEventListener("ended", onStop);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("seeked", onSeeked);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onStop);
      audio.removeEventListener("ended", onStop);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("seeked", onSeeked);
      audio.pause();
      audio.removeAttribute("src");
      audioRef.current = null;
    };
  }, []);

  const audioUrl = data?.audioUrl;

  const autoPlayRef = useRef(autoPlay);
  autoPlayRef.current = autoPlay;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(0);
    setDuration(0);
    if (audioUrl) {
      audio.src = audioUrl;
      audio.load();
      if (autoPlayRef.current) void audio.play().catch(() => undefined);
    } else {
      audio.pause();
      audio.removeAttribute("src");
    }
  }, [audioUrl]);

  // Show the aligner's duration until the browser reports its own.
  const reportedDuration = data?.duration;
  useEffect(() => {
    setDuration((current) => current || reportedDuration || 0);
  }, [reportedDuration]);

  // Follow the playhead only while it is moving.
  useEffect(() => {
    if (!isPlaying) return;
    let frame = 0;
    const tick = () => {
      const audio = audioRef.current;
      if (audio) setCurrentTime(audio.currentTime);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying]);

  // ------------------------------------------------------------- highlighting

  const { words: sourceWords } = useMemo(() => tokenize(source), [source]);
  const timings = data?.words;

  /**
   * One span per rendered token. The transcriber does not split on whitespace,
   * so the two lists are aligned rather than zipped — see `align.ts`. A token
   * it could not place stays `undefined` instead of borrowing its neighbour's
   * timing.
   */
  const spans = useMemo<(SpokenSpan | undefined)[]>(() => {
    if (!timings?.length) return new Array(sourceWords.length).fill(undefined);
    try {
      return alignTokens(sourceWords, timings);
    } catch {
      // Never take the passage down over a timing problem: render it unlit.
      return new Array(sourceWords.length).fill(undefined);
    }
  }, [sourceWords, timings]);

  const [currentWordIndex, setCurrentWordIndex] = useState(-1);

  useEffect(() => {
    setCurrentWordIndex(-1);
  }, [debounced]);

  useEffect(() => {
    if (!isPlaying) return;
    const next = tokenIndexAt(spans, currentTime + LOOKAHEAD_SECONDS);
    if (next !== -1) setCurrentWordIndex(next);
  }, [spans, isPlaying, currentTime]);

  // The index always points at a rendered token, even if the text shrank out
  // from under a stale highlight. Nothing may run off the end of the passage.
  const activeIndex =
    currentWordIndex >= 0 && currentWordIndex < sourceWords.length
      ? currentWordIndex
      : -1;

  const words = useMemo<DisplayWord[]>(
    () =>
      sourceWords.map((word, index) => {
        const span = spans[index];
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
          start: span?.start,
          end: span?.end,
        };
      }),
    [sourceWords, spans, activeIndex],
  );

  const currentWord = activeIndex >= 0 ? words[activeIndex] : undefined;

  const changeRef = useRef(onWordChange);
  changeRef.current = onWordChange;
  useEffect(() => {
    changeRef.current?.(activeIndex, currentWord);
    // Fire on index changes only — not on every re-render of the word list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  // ---------------------------------------------------------------- controls

  const play = useCallback(() => {
    void audioRef.current?.play().catch(() => undefined);
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => undefined);
    else audio.pause();
  }, []);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const limit = Number.isFinite(audio.duration) ? audio.duration : seconds;
    const next = Math.max(0, Math.min(limit, seconds));
    audio.currentTime = next;
    setCurrentTime(next);
  }, []);

  const seekToWord = useCallback(
    (index: number) => {
      const span = spans[index];
      if (!span) return;
      seek(span.start);
      setCurrentWordIndex(index);
      play();
    },
    [spans, seek, play],
  );

  const getAudioElement = useCallback(() => audioRef.current, []);

  const seekToFraction = useCallback(
    (fraction: number) => {
      if (!duration) return;
      seek(Math.max(0, Math.min(1, fraction)) * duration);
    },
    [duration, seek],
  );

  const status = error
    ? "error"
    : isLoading
      ? "loading"
      : data
        ? "ready"
        : "idle";

  return {
    text: source,
    words,
    currentWordIndex: activeIndex,
    currentWord,
    status,
    isLoading,
    isPlaying,
    error: error as Error | undefined,
    currentTime,
    duration,
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
