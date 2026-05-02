"use client";
import { useHighlightText, useTranscription } from "@/hooks";
import { cn } from "@/lib/utils";
import { Word } from "@/types/audioTypes";
import { Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface AudioWidgetProps {
  content: string;
}

export const AudioWidget = ({ content }: AudioWidgetProps) => {
  const { data, error, isLoading } = useTranscription(content);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { currWordIndex } = useHighlightText({
    transcription: data?.transcription,
    currentTime,
    isPlaying,
    resetKey: content,
  });

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      const audio = audioRef.current;
      if (audio) setCurrentTime(audio.currentTime);
    }, 100);
    return () => clearInterval(id);
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  }, []);

  const seekToWord = useCallback(
    (wordIndex: number) => {
      const audio = audioRef.current;
      const word = data?.transcription.words[wordIndex];
      if (!audio || !word) return;
      audio.currentTime = word.startSecond;
      setCurrentTime(word.startSecond);
      void audio.play();
    },
    [data],
  );

  const onSeekFraction = useCallback(
    (fraction: number) => {
      const audio = audioRef.current;
      if (!audio || !duration) return;
      const t = Math.max(0, Math.min(duration, fraction * duration));
      audio.currentTime = t;
      setCurrentTime(t);
    },
    [duration],
  );

  const ready = !!data?.audioUrl;

  return (
    <div className="space-y-10">
      <ReadingPassage
        content={content}
        currWordIndex={currWordIndex}
        words={data?.transcription.words}
        onWordClick={seekToWord}
      />

      <div className="space-y-3">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={togglePlay}
            disabled={!ready}
            aria-label={isPlaying ? "Pause" : "Play"}
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-foreground bg-transparent text-foreground transition-colors duration-200",
              "hover:bg-foreground hover:text-background",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-background",
              "disabled:cursor-not-allowed disabled:opacity-25",
            )}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" strokeWidth={1.25} fill="currentColor" />
            ) : (
              <Play
                className="h-5 w-5 translate-x-[1px]"
                strokeWidth={1.25}
                fill="currentColor"
              />
            )}
          </button>

          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={onSeekFraction}
          />
        </div>

        <Status isLoading={isLoading} error={error} />
      </div>

      <audio
        ref={audioRef}
        src={data?.audioUrl}
        preload="metadata"
        onLoadedMetadata={(e) =>
          setDuration((e.target as HTMLAudioElement).duration || 0)
        }
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
};

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (fraction: number) => void;
}

const ProgressBar = ({ currentTime, duration, onSeek }: ProgressBarProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const seekFromEvent = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)));
  };
  return (
    <div className="flex flex-1 items-center gap-5">
      <div
        ref={trackRef}
        onClick={(e) => seekFromEvent(e.clientX)}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(currentTime)}
        className="group relative flex h-6 flex-1 cursor-pointer items-center"
      >
        <div className="relative h-px w-full bg-border">
          <div
            className="absolute inset-y-0 left-0 bg-foreground"
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            style={{ left: `${pct}%` }}
          />
        </div>
      </div>
      <div className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-muted-foreground">
        {formatTime(currentTime)}
        <span className="mx-1.5 text-border">/</span>
        {formatTime(duration)}
      </div>
    </div>
  );
};

const Status = ({
  isLoading,
  error,
}: {
  isLoading: boolean;
  error: Error | undefined;
}) => {
  if (error) {
    return (
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-destructive">
        Failed to compose audio &mdash; {error.message}
      </p>
    );
  }
  if (isLoading) {
    return (
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        <span>Composing</span>
        <span className="inline-flex items-end gap-[3px]">
          <Dot delay="0ms" />
          <Dot delay="180ms" />
          <Dot delay="360ms" />
        </span>
      </p>
    );
  }
  return null;
};

const Dot = ({ delay }: { delay: string }) => (
  <span
    className="block h-[3px] w-[3px] rounded-full bg-current"
    style={{ animation: "pulse 1.2s ease-in-out infinite", animationDelay: delay }}
  />
);

interface ReadingPassageProps {
  content: string;
  currWordIndex: number;
  words: Word[] | undefined;
  onWordClick: (index: number) => void;
}

const ReadingPassage = ({
  content,
  currWordIndex,
  words,
  onWordClick,
}: ReadingPassageProps) => {
  const displayWords = content.split(" ");
  const clickable = !!words;
  return (
    <p className="font-serif text-[1.375rem] leading-[1.55] text-foreground sm:text-2xl">
      {displayWords.map((word, i) => {
        const canClick = clickable && i < (words?.length ?? 0);
        const isCurrent = i === currWordIndex;
        const wasSpoken = currWordIndex >= 0 && i < currWordIndex;
        return (
          <span key={i}>
            <span
              onClick={canClick ? () => onWordClick(i) : undefined}
              className={cn(
                "rounded-[2px] -mx-[0.05em] px-[0.05em] transition-colors duration-200",
                wasSpoken && !isCurrent && "bg-highlight/40",
                isCurrent && "bg-highlight shadow-[inset_0_-0.12em_0_hsl(var(--accent))]",
                canClick &&
                  !isCurrent &&
                  "cursor-pointer hover:bg-highlight/60",
              )}
            >
              {word}
            </span>
            {i < displayWords.length - 1 ? " " : ""}
          </span>
        );
      })}
    </p>
  );
};

function formatTime(t: number): string {
  if (!Number.isFinite(t) || t < 0) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}
