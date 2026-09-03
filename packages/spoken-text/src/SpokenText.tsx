"use client";

import {
  useContext,
  useEffect,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  collectDocument,
  DEFAULT_SKIP,
  documentFromText,
  renderLeaf,
  walkDocument,
  type SpokenSelector,
} from "./document.js";
import { SpokenTextContext } from "./SpokenTextProvider.js";
import { useSpokenDocument, useStableDocument } from "./useSpokenDocument.js";
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

export type SpokenTextProps = SpokenTextOptions & {
  /**
   * A passage, or a tree of elements. Elements keep their structure: an `h2`
   * stays an `h2`, a link stays a link, and only text is wrapped. Text inside
   * a child component is invisible to the walk — pass the elements themselves.
   */
  children?: ReactNode;
  /** A controller from `useSpokenText`, if you are holding one yourself. */
  speech?: SpokenTextController;
  /** Element to render into. Default `"div"` for elements, `"p"` for a string. */
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
  /** Click a word to hear the document from there. Default `true`. */
  seekOnWordClick?: boolean;
  /**
   * Parts of the tree to leave unspoken. They still render, exactly where they
   * are; they are only dropped from the text handed to the aligner, so the
   * words on either side of an inline skip stay correctly timed.
   */
  skip?: readonly SpokenSelector[];
  /** Speak only these parts of the tree. Unset means all of it. */
  only?: readonly SpokenSelector[];
};

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
 * Speak a passage, or a whole document, and light up each word as it is said.
 *
 * ```tsx
 * <SpokenText>Any text you like.</SpokenText>
 *
 * <SpokenText>
 *   <h2>Causes of the War</h2>
 *   <p>By 1754, European countries were competing…</p>
 * </SpokenText>
 * ```
 */
export const SpokenText = ({
  children,
  speech,
  as,
  className,
  style,
  classNames,
  renderWord,
  seekOnWordClick = true,
  skip = DEFAULT_SKIP,
  only,
  endpoint,
  fetchAlignment,
  onWordChange,
  debounceMs,
  autoPlay,
}: SpokenTextProps) => {
  const context = useContext(SpokenTextContext);
  const isTree = children != null && typeof children !== "string";

  // What the children say, so a controller can be built for it. Memoized on
  // the children themselves, so playback does not re-walk the tree every frame.
  const walked = useMemo(
    () =>
      isTree
        ? collectDocument(children, { skip, only })
        : documentFromText(typeof children === "string" ? children : ""),
    [children, isTree, skip, only],
  );
  const document = useStableDocument(walked);

  // The provider owns the document when there is one, and a passed-in
  // controller owns it outright; otherwise this component manages its own.
  const delegated = !!speech || !!context;
  const owned = useSpokenDocument(delegated ? null : document, {
    endpoint,
    fetchAlignment,
    debounceMs,
    autoPlay,
  });
  const controller = speech ?? context?.controller ?? owned;

  const register = context?.register;
  useEffect(() => {
    if (!register || speech) return;
    register(document);
    return () => register(null);
  }, [register, speech, document]);

  const { currentWordIndex, currentWord } = controller;
  useEffect(() => {
    onWordChange?.(currentWordIndex, currentWord);
    // Fire on index changes only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWordIndex]);

  /**
   * A word is worth clicking when it has a timestamp, and also when its block
   * has not been fetched: clicking one of those fetches it and plays from
   * there. A word left untimed inside a block that did load is neither.
   */
  const unfetched = useMemo(() => {
    const flags = new Uint8Array(controller.words.length);
    for (const segment of controller.segments) {
      if (segment.status !== "ready") flags.fill(1, segment.start, segment.end);
    }
    return flags;
  }, [controller.words.length, controller.segments]);

  const spoken = (text: string, index: number): ReactNode => {
    const word: DisplayWord = controller.words[index] ?? {
      text,
      index,
      state: "future",
      seekable: false,
    };

    if (renderWord) return renderWord(word);

    const clickable =
      seekOnWordClick && (word.seekable || unfetched[index] === 1);
    const stateClass = classNames?.[word.state];
    const wordClass =
      [classNames?.word, stateClass].filter(Boolean).join(" ") || undefined;

    return (
      <span
        className={wordClass}
        data-spoken-state={word.state}
        data-spoken-index={word.index}
        onClick={clickable ? () => controller.seekToWord(word.index) : undefined}
        style={{
          ...(classNames?.word ? undefined : WORD_STYLE),
          ...(stateClass ? undefined : STATE_STYLE[word.state]),
          ...(clickable ? { cursor: "pointer" } : undefined),
        }}
      >
        {word.text}
      </span>
    );
  };

  const Tag = as ?? (isTree ? "div" : "p");

  // A tree keeps its own whitespace rules; a passage is one string, so its
  // line breaks have to survive.
  const rootStyle = isTree ? style : { ...ROOT_STYLE, ...style };

  return (
    <Tag className={className} style={rootStyle}>
      {isTree
        ? walkDocument(children, { skip, only }, spoken).node
        : renderLeaf(controller.text, 0, spoken)}
    </Tag>
  );
};
