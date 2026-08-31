"use client";

import { useRef, useState, type CSSProperties } from "react";
import { PauseIcon, PlayIcon } from "./icons.js";
import type { SpokenTextController } from "./types.js";

export type TransportClassNames = {
  root?: string;
  button?: string;
  track?: string;
  /** The played portion of the track. */
  elapsed?: string;
  /** The dot that marks the playhead. */
  thumb?: string;
  time?: string;
  status?: string;
};

export type TransportProps = {
  /** The controller returned by `useSpokenText`. */
  speech: SpokenTextController;
  className?: string;
  /**
   * Per-part classes. Supplying one replaces the built-in look for that part,
   * so your own CSS is not fighting inline styles.
   */
  classNames?: TransportClassNames;
  /** Show elapsed / total time. Default `true`. */
  showTime?: boolean;
  /** Show the loading and error line. Default `true`. */
  showStatus?: boolean;
};

const S = {
  root: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  row: { display: "flex", alignItems: "center", gap: "1.25rem" },
  button: {
    display: "flex",
    height: "3.5rem",
    width: "3.5rem",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9999px",
    border: "1px solid currentColor",
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
  },
  trackArea: {
    position: "relative",
    display: "flex",
    height: "1.5rem",
    flex: 1,
    cursor: "pointer",
    alignItems: "center",
  },
  track: { position: "relative", height: "1px", width: "100%", background: "currentColor", opacity: 0.25 },
  elapsed: { position: "absolute", insetBlock: 0, left: 0, background: "currentColor" },
  thumb: {
    position: "absolute",
    top: "50%",
    height: "0.5rem",
    width: "0.5rem",
    transform: "translate(-50%, -50%)",
    borderRadius: "9999px",
    background: "currentColor",
  },
  time: { whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", fontSize: "0.625rem", letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.6 },
  status: { fontSize: "0.625rem", letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.6 },
} satisfies Record<string, CSSProperties>;

/**
 * A play button and a scrubber for a `useSpokenText` controller. Optional —
 * `<SpokenText>` highlights fine on its own.
 */
export const Transport = ({
  speech,
  className,
  classNames,
  showTime = true,
  showStatus = true,
}: TransportProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);

  const { currentTime, duration, isPlaying, isLoading, error } = speech;
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const ready = !!speech.audioUrl;

  const seekFrom = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    speech.seekToFraction((clientX - rect.left) / rect.width);
  };

  return (
    <div
      className={[className, classNames?.root].filter(Boolean).join(" ") || undefined}
      style={classNames?.root ? undefined : S.root}
    >
      <div style={S.row}>
        <button
          type="button"
          onClick={speech.toggle}
          disabled={!ready}
          aria-label={isPlaying ? "Pause" : "Play"}
          className={classNames?.button}
          style={
            classNames?.button
              ? undefined
              : { ...S.button, opacity: ready ? 1 : 0.25, cursor: ready ? "pointer" : "not-allowed" }
          }
        >
          {isPlaying ? (
            <PauseIcon width="1.25rem" height="1.25rem" strokeWidth={1.25} fill="currentColor" />
          ) : (
            <PlayIcon
              width="1.25rem"
              height="1.25rem"
              strokeWidth={1.25}
              fill="currentColor"
              style={{ transform: "translateX(1px)" }}
            />
          )}
        </button>

        <div style={{ ...S.row, flex: 1 }}>
          <div
            ref={trackRef}
            onClick={(e) => seekFrom(e.clientX)}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(currentTime)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") speech.seek(currentTime + 5);
              if (e.key === "ArrowLeft") speech.seek(currentTime - 5);
            }}
            style={S.trackArea}
          >
            <div
              className={classNames?.track}
              style={classNames?.track ? undefined : S.track}
            >
              <div
                className={classNames?.elapsed}
                style={{
                  ...(classNames?.elapsed ? undefined : S.elapsed),
                  position: "absolute",
                  insetBlock: 0,
                  left: 0,
                  width: `${pct}%`,
                }}
              />
              <div
                className={classNames?.thumb}
                style={{
                  ...(classNames?.thumb ? undefined : S.thumb),
                  position: "absolute",
                  left: `${pct}%`,
                  opacity: hovering ? 1 : 0,
                  transition: "opacity 200ms ease",
                }}
              />
            </div>
          </div>

          {showTime && (
            <div
              className={classNames?.time}
              style={classNames?.time ? undefined : S.time}
            >
              {formatTime(currentTime)}
              <span style={{ margin: "0 0.375rem", opacity: 0.5 }}>/</span>
              {formatTime(duration)}
            </div>
          )}
        </div>
      </div>

      {showStatus && (error || isLoading) && (
        <p
          className={classNames?.status}
          style={classNames?.status ? undefined : S.status}
        >
          {error ? (
            `Failed to compose audio: ${error.message}`
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <style>{PULSE_KEYFRAMES}</style>
              Composing
              <span style={{ display: "inline-flex", alignItems: "flex-end", gap: "3px" }}>
                <Dot delay="0ms" />
                <Dot delay="180ms" />
                <Dot delay="360ms" />
              </span>
            </span>
          )}
        </p>
      )}
    </div>
  );
};

const PULSE_KEYFRAMES =
  "@keyframes spoken-text-pulse{0%,100%{opacity:.35}50%{opacity:1}}";

const Dot = ({ delay }: { delay: string }) => (
  <span
    style={{
      display: "block",
      height: "3px",
      width: "3px",
      borderRadius: "9999px",
      background: "currentColor",
      animation: "spoken-text-pulse 1.2s ease-in-out infinite",
      animationDelay: delay,
    }}
  />
);

const formatTime = (t: number): string => {
  if (!Number.isFinite(t) || t < 0) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};
