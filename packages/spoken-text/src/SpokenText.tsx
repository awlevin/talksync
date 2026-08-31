"use client";

import { useEffect, useMemo, type CSSProperties, type ReactNode } from "react";
import { tokenize } from "./tokenize.js";
import { useSpokenText } from "./useSpokenText.js";
import type {
  DisplayWord,
  SpokenTextController,
  SpokenTextOptions,
  WordState,
} from "./types.js";

export type SpokenTextClassNames = {
  /** Applied to every word. */
  word?: string;
  /** Applied to words already spoken. */
  past?: string;
  /** Applied to the word being spoken. */
  current?: string;
  /** Applied to words not yet spoken. */
  future?: string;
};

type SpokenTextBaseProps = SpokenTextOptions & {
  /** Element to render the passage into. Default `"p"`. */
  as?: "p" | "div" | "span" | "article" | "section" | "blockquote";
  className?: string;
  style?: CSSProperties;
  /**
   * Per-word classes. Supplying one replaces the built-in look for that slot,
   * so Tailwind or CSS Modules classes are not fighting inline styles.
   */
  classNames?: SpokenTextClassNames;
  /** Take over word rendering entirely. Whitespace is still inserted for you. */
  renderWord?: (word: DisplayWord) => ReactNode;
  /** Click a word to hear the passage from there. Default `true`. */
  seekOnWordClick?: boolean;
};

export type SpokenTextProps = SpokenTextBaseProps &
  (
    | { children: string; speech?: undefined }
    | { children?: string; speech: SpokenTextController }
  );

const ROOT_STYLE: CSSProperties = { whiteSpace: "pre-wrap" };

const WORD_STYLE: CSSProperties = {
  borderRadius: "2px",
  margin: "0 -0.05em",
  padding: "0 0.05em",
  transition: "background-color 200ms ease, box-shadow 200ms ease",
};

const STATE_STYLE: Record<WordState, CSSProperties | undefined> = {
  past: { backgroundColor: "var(--spoken-text-past, rgba(240, 199, 116, 0.4))" },
  current: {
    backgroundColor: "var(--spoken-text-current, rgb(240, 199, 116))",
    boxShadow: "inset 0 -0.12em 0 var(--spoken-text-accent, rgb(164, 76, 46))",
  },
  future: undefined,
};

/**
 * Speak a passage and light up each word as it is said.
 *
 * ```tsx
 * <SpokenText>Any text you like.</SpokenText>
 * ```
 */
export const SpokenText = ({
  children,
  speech,
  as: Tag = "p",
  className,
  style,
  classNames,
  renderWord,
  seekOnWordClick = true,
  endpoint,
  fetchAlignment,
  onWordChange,
  debounceMs,
  autoPlay,
}: SpokenTextProps) => {
  const owned = useSpokenText(speech ? null : (children ?? ""), {
    endpoint,
    fetchAlignment,
    debounceMs,
    autoPlay,
  });
  const controller = speech ?? owned;

  const { currentWordIndex, currentWord } = controller;
  useEffect(() => {
    onWordChange?.(currentWordIndex, currentWord);
    // Fire on index changes only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWordIndex]);

  // Always tokenize what the controller is tracking, so words and the
  // whitespace between them can never fall out of step.
  const { lead, separators } = useMemo(
    () => tokenize(controller.text),
    [controller.text],
  );

  return (
    <Tag className={className} style={{ ...ROOT_STYLE, ...style }}>
      {lead}
      {controller.words.map((word) => {
        const clickable = seekOnWordClick && word.seekable;
        const stateClass = classNames?.[word.state];
        const wordClass =
          [classNames?.word, stateClass].filter(Boolean).join(" ") || undefined;

        return (
          <span key={word.index}>
            {renderWord ? (
              renderWord(word)
            ) : (
              <span
                className={wordClass}
                data-spoken-state={word.state}
                data-spoken-index={word.index}
                onClick={
                  clickable ? () => controller.seekToWord(word.index) : undefined
                }
                style={{
                  ...(classNames?.word ? undefined : WORD_STYLE),
                  ...(stateClass ? undefined : STATE_STYLE[word.state]),
                  ...(clickable ? { cursor: "pointer" } : undefined),
                }}
              >
                {word.text}
              </span>
            )}
            {separators[word.index] ?? ""}
          </span>
        );
      })}
    </Tag>
  );
};
