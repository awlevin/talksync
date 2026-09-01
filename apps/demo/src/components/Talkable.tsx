"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  SpokenText,
  tokenize,
  useSpokenText,
  type DisplayWord,
  type SpokenTextController,
} from "spoken-text";

/**
 * The page reads itself.
 *
 * Every block of prose is its own passage: click a word and you hear that
 * block from that word, and it stops at the end of that block rather than
 * running on into the next one. Two rules make that safe on a page with a
 * couple of dozen passages on it:
 *
 *  1. Nothing is fetched until a word is clicked. `useSpokenText` starts
 *     working the moment it is handed a string, so it is handed `null` until
 *     then and a stand-in controller renders the words in the meantime.
 *  2. One passage at a time. Each `<SpokenText>` owns its own audio element,
 *     so the page keeps the register of who is speaking and stops the rest.
 */

type Stop = { current: () => void };

type Stage = {
  join: (id: string, stop: Stop) => () => void;
  claim: (id: string) => void;
};

const StageContext = createContext<Stage | null>(null);

/** Wrap the part of the page whose passages should take turns. */
export const SpeechStage = ({ children }: { children: ReactNode }) => {
  const members = useRef<Map<string, Stop>>(new Map());

  const stage = useMemo<Stage>(
    () => ({
      join: (id, stop) => {
        members.current.set(id, stop);
        return () => {
          members.current.delete(id);
        };
      },
      claim: (id) => {
        members.current.forEach((stop, other) => {
          if (other !== id) stop.current();
        });
      },
    }),
    [],
  );

  return (
    <StageContext.Provider value={stage}>{children}</StageContext.Provider>
  );
};

/**
 * Take turns with every other passage on the page. Whatever starts playing
 * silences the rest, and the returned function claims the page early, so a
 * click does not have to wait out a fetch before the old passage stops.
 */
export const useSoleSpeaker = (speech: SpokenTextController): (() => void) => {
  const stage = useContext(StageContext);
  const id = useId();

  const stop = useRef<() => void>(() => {});
  stop.current = () => speech.pause();

  useEffect(() => stage?.join(id, stop), [stage, id]);

  const claim = useCallback(() => stage?.claim(id), [stage, id]);

  const { isPlaying } = speech;
  useEffect(() => {
    if (isPlaying) claim();
  }, [isPlaying, claim]);

  return claim;
};

export type TalkableProps = {
  /** The passage, as one plain string. */
  children: string;
  /**
   * Words to keep in the mono face, the way `<M>` sets them in plain prose.
   * Matched against each word with a trailing period or comma removed.
   */
  code?: readonly string[];
  as?: "p" | "div" | "span";
  className?: string;
};

/** A trailing period or comma belongs to the sentence, not to the name. */
const bare = (word: string): string => word.replace(/[.,]+$/, "");

const STATE_CLASS = {
  word: "tw",
  past: "tw tw-past",
  current: "tw tw-current",
  future: "tw",
} as const;

/** Chrome and Safari ignore `currentTime` until the metadata has landed. */
const HAVE_METADATA = 1;

/**
 * A block of prose that can be spoken, and is silent until it is asked.
 */
export const Talkable = ({
  children: text,
  code,
  as = "p",
  className,
}: TalkableProps) => {
  const [armed, setArmed] = useState(false);
  const [pending, setPending] = useState<number | null>(null);

  const speech = useSpokenText(armed ? text : null);
  const claim = useSoleSpeaker(speech);

  const { status, audioUrl } = speech;

  // The words as they read before anything has been fetched. They are marked
  // seekable so the built-in click handler is live from the first paint.
  const resting = useMemo<DisplayWord[]>(
    () =>
      tokenize(text).words.map((word, index) => ({
        text: word,
        index,
        state: "future",
        seekable: true,
      })),
    [text],
  );

  const speechRef = useRef(speech);
  speechRef.current = speech;

  const speak = useCallback(
    (index: number) => {
      claim();
      if (!armed) {
        setArmed(true);
        setPending(index);
        return;
      }
      const live = speechRef.current;
      if (live.status !== "ready") {
        setPending(index);
        return;
      }
      if (live.words[index]?.seekable) live.seekToWord(index);
      else live.play();
    },
    [armed, claim],
  );

  // The click that armed the passage is honoured once the audio can be seeked.
  useEffect(() => {
    if (pending == null || status !== "ready") return;
    const audio = speechRef.current.getAudioElement();
    if (!audio) return;

    const index = pending;
    const go = () => {
      setPending(null);
      const live = speechRef.current;
      if (live.words[index]?.seekable) live.seekToWord(index);
      else live.play();
    };

    if (audio.readyState >= HAVE_METADATA) {
      go();
      return;
    }
    audio.addEventListener("loadedmetadata", go, { once: true });
    return () => audio.removeEventListener("loadedmetadata", go);
    // `audioUrl` is what swaps the element's source; `speechRef` is always current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, status, audioUrl]);

  // A passage that could not be spoken goes back to being plain text, so the
  // next click is a fresh attempt rather than a dead one.
  useEffect(() => {
    if (status !== "error") return;
    setArmed(false);
    setPending(null);
  }, [status]);

  // A passage that has finished, or that has been silenced by another one,
  // puts its highlight away. Otherwise every passage the reader has visited
  // keeps a lit word, and the page ends up covered in them. Coming back is
  // free: the alignment is already in the package's cache, so re-arming
  // resolves from memory without going near the network.
  const spoke = useRef(false);
  const { isPlaying } = speech;
  useEffect(() => {
    if (isPlaying) {
      spoke.current = true;
      return;
    }
    if (!spoke.current) return;
    spoke.current = false;
    setArmed(false);
    setPending(null);
  }, [isPlaying]);

  const controller = useMemo<SpokenTextController>(
    () => ({
      ...speech,
      ...(armed ? null : { text, words: resting }),
      seekToWord: speak,
    }),
    [speech, armed, text, resting, speak],
  );

  const codeWords = useMemo(() => new Set(code ?? []), [code]);

  const root = ["talkable", className, pending != null ? "tw-waiting" : undefined]
    .filter(Boolean)
    .join(" ");

  // Words that carry a name have to be set in the mono face, and `classNames`
  // cannot reach a single word, so those passages render their own spans.
  return codeWords.size > 0 ? (
    <SpokenText
      as={as}
      className={root}
      speech={controller}
      renderWord={(word) => (
        <span
          className={
            codeWords.has(bare(word.text))
              ? `${STATE_CLASS[word.state]} tw-code`
              : STATE_CLASS[word.state]
          }
          data-spoken-state={word.state}
          data-spoken-index={word.index}
          onClick={() => speak(word.index)}
        >
          {word.text}
        </span>
      )}
    />
  ) : (
    <SpokenText
      as={as}
      className={root}
      speech={controller}
      classNames={{
        word: STATE_CLASS.word,
        past: "tw-past",
        current: "tw-current",
      }}
    />
  );
};
