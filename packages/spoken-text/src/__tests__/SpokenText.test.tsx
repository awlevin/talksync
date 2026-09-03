import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { clearAlignmentCache } from "../alignmentCache.js";
import { Player } from "../Player.js";
import { SpokenText } from "../SpokenText.js";
import {
  SpokenTextProvider,
  useSpokenTextController,
} from "../SpokenTextProvider.js";
import { tokenize } from "../tokenize.js";
import type {
  Alignment,
  DisplayWord,
  SpokenTextController,
  SpokenWord,
} from "../types.js";

/** Even timings, one word after another, so offsets are easy to read. */
const timings = (text: string, each = 0.5): SpokenWord[] =>
  tokenize(text).words.map((word, index) => ({
    text: word,
    start: index * each,
    end: (index + 1) * each,
  }));

const aligned = (text: string, duration?: number): Alignment => ({
  audioUrl: `blob:${encodeURIComponent(text)}`,
  words: timings(text),
  duration,
});

/** An aligner that answers from a table, and fails loudly on anything else. */
const from = (table: Record<string, Alignment>) => async (text: string) => {
  const alignment = table[text];
  if (!alignment) throw new Error(`No fixture for: ${JSON.stringify(text)}`);
  return alignment;
};

/** Hand the controller under test back to the test. */
const Capture = ({
  into,
}: {
  into: { current: SpokenTextController | undefined };
}) => {
  into.current = useSpokenTextController();
  return null;
};

const held = () => ({ current: undefined as SpokenTextController | undefined });

beforeEach(clearAlignmentCache);

describe("<SpokenText> with a string child", () => {
  /**
   * The markup this component renders, written out by hand: a word span and a
   * separator span per word, and the band carried across the gap between two
   * words that have both been reached.
   */
  const ByHand = ({ speech }: { speech: SpokenTextController }) => {
    const { lead, separators } = tokenize(speech.text);
    const past = {
      backgroundColor: "var(--spoken-text-past, rgba(240, 199, 116, 0.4))",
    };
    return (
      <p style={{ whiteSpace: "pre-wrap" }}>
        {lead}
        {speech.words.map((word) => {
          const gap = separators[word.index] ?? "";
          const next = speech.words[word.index + 1];
          const lit = !!next && next.state !== "future";
          return (
            <span key={word.index}>
              <span
                data-spoken-state={word.state}
                data-spoken-index={word.index}
                style={{
                  transition:
                    "background-color 200ms ease, box-shadow 200ms ease",
                  ...(word.state === "past"
                    ? past
                    : word.state === "current"
                      ? {
                          backgroundColor:
                            "var(--spoken-text-current, rgb(240, 199, 116))",
                          boxShadow:
                            "inset 0 -0.12em 0 var(--spoken-text-accent, rgb(164, 76, 46))",
                          borderRadius: "2px",
                        }
                      : undefined),
                  ...(word.seekable ? { cursor: "pointer" } : undefined),
                }}
              >
                {word.text}
              </span>
              {gap ? (
                <span
                  data-spoken-state={lit ? "past" : "future"}
                  style={{
                    transition: "background-color 200ms ease",
                    ...(lit ? past : undefined),
                  }}
                >
                  {gap}
                </span>
              ) : (
                gap
              )}
            </span>
          );
        })}
      </p>
    );
  };

  const text = "  The tide came in\nslowly that morning. ";

  const words: DisplayWord[] = tokenize(text).words.map((word, index) => ({
    text: word,
    index,
    state: index === 2 ? "current" : index < 2 ? "past" : "future",
    seekable: true,
    start: index * 0.5,
    end: (index + 1) * 0.5,
  }));

  const speech = {
    text,
    words,
    currentWordIndex: 2,
    currentWord: words[2],
    segments: [
      {
        start: 0,
        end: words.length,
        kind: "paragraph" as const,
        status: "ready" as const,
      },
    ],
    status: "ready" as const,
    isLoading: false,
    isPlaying: false,
    error: undefined,
    currentTime: 1,
    duration: 4,
    durationIsEstimate: false,
    audioUrl: "blob:x",
    play: () => {},
    pause: () => {},
    toggle: () => {},
    seek: () => {},
    seekToWord: () => {},
    seekToFraction: () => {},
    getAudioElement: () => null,
  } satisfies SpokenTextController;

  it("renders one band across the words and the gaps between them", () => {
    const now = render(<SpokenText speech={speech} />).container.innerHTML;
    const expected = render(<ByHand speech={speech} />).container.innerHTML;
    expect(now).toBe(expected);
  });

  it("lights the gaps up to the current word and no further", () => {
    const { container } = render(<SpokenText speech={speech} />);
    const gaps = [...container.querySelectorAll("[data-spoken-state]")].filter(
      (el) => !el.hasAttribute("data-spoken-index"),
    );

    // Words 0 and 1 are past and word 2 is current, so the two gaps before it
    // are lit and every gap after it is not.
    expect(gaps.map((el) => el.getAttribute("data-spoken-state"))).toEqual([
      "past",
      "past",
      "future",
      "future",
      "future",
      "future",
      "future",
    ]);
  });

  it("puts the passage back together byte for byte", () => {
    const { container } = render(<SpokenText speech={speech} />);
    expect(container.textContent).toBe(text);
  });

  it("is one segment, and times its words from the route", async () => {
    const seen = held();
    render(
      <SpokenTextProvider fetchAlignment={from({ "One two three": aligned("One two three", 1.5) })}>
        <Capture into={seen} />
        <SpokenText>One two three</SpokenText>
      </SpokenTextProvider>,
    );

    await waitFor(() => expect(seen.current?.status).toBe("ready"));
    expect(seen.current?.segments).toEqual([
      { start: 0, end: 3, kind: "paragraph", status: "ready" },
    ]);
    expect(seen.current?.words.map((w) => [w.text, w.start])).toEqual([
      ["One", 0],
      ["two", 0.5],
      ["three", 1],
    ]);
    expect(seen.current?.duration).toBe(1.5);
    expect(seen.current?.durationIsEstimate).toBe(false);
  });
});

describe("<SpokenText> with element children", () => {
  it("keeps the structure and wraps only the words", () => {
    const { container } = render(
      <SpokenText>
        <h2>What is living inside</h2>
        <p>
          Wild yeasts eat <a href="/sugar">sugar</a>.
        </p>
      </SpokenText>,
    );

    expect(container.querySelector("h2")?.textContent).toBe(
      "What is living inside",
    );
    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("/sugar");
    expect(link?.textContent).toBe("sugar");
    expect(link?.querySelector("[data-spoken-index]")?.textContent).toBe(
      "sugar",
    );

    // One index per word, across both blocks, in reading order. The full stop
    // outside the link is its own token, which the aligner leaves untimed.
    expect(
      [...container.querySelectorAll("[data-spoken-index]")].map(
        (el) => el.textContent,
      ),
    ).toEqual([
      "What", "is", "living", "inside", "Wild", "yeasts", "eat", "sugar", ".",
    ]);
    expect(container.querySelector("p")?.textContent).toBe(
      "Wild yeasts eat sugar.",
    );
  });

  it("renders into a div by default, and a p for a string", () => {
    const tree = render(
      <SpokenText>
        <p>Some prose.</p>
      </SpokenText>,
    );
    expect(tree.container.firstElementChild?.tagName).toBe("DIV");

    const passage = render(<SpokenText>Some prose.</SpokenText>);
    expect(passage.container.firstElementChild?.tagName).toBe("P");
  });

  it("times the word after an inline skip as if the skip were never there", async () => {
    const seen = held();
    render(
      <SpokenTextProvider
        fetchAlignment={from({ "Pass the  option.": aligned("Pass the option.") })}
      >
        <Capture into={seen} />
        <SpokenText>
          <p>
            Pass the <code>debounceMs</code> option.
          </p>
        </SpokenText>
      </SpokenTextProvider>,
    );

    await waitFor(() => expect(seen.current?.status).toBe("ready"));
    expect(seen.current?.words.map((w) => [w.text, w.start])).toEqual([
      ["Pass", 0],
      ["the", 0.5],
      ["option.", 1],
    ]);
  });

  it("leaves skipped content rendered where it was written", () => {
    const { container } = render(
      <SpokenText>
        <p>
          Pass the <code>debounceMs</code> option.
        </p>
        <pre>const x = 1;</pre>
      </SpokenText>,
    );

    expect(container.querySelector("code")?.textContent).toBe("debounceMs");
    expect(container.querySelector("code")?.querySelector("span")).toBeNull();
    expect(container.querySelector("pre")?.textContent).toBe("const x = 1;");
    expect(container.querySelector("pre")?.querySelector("span")).toBeNull();
  });

  it("speaks only what `only` fences in, and renders the rest untouched", () => {
    const { container } = render(
      <SpokenText only={[".prose"]}>
        <nav>
          <p>Skip to content</p>
        </nav>
        <article className="prose">
          <p>The body.</p>
        </article>
      </SpokenText>,
    );

    expect(container.querySelector("nav")?.textContent).toBe("Skip to content");
    expect(container.querySelector("nav [data-spoken-index]")).toBeNull();
    expect(
      [...container.querySelectorAll("[data-spoken-index]")].map(
        (el) => el.textContent,
      ),
    ).toEqual(["The", "body."]);
  });
});

describe("segments", () => {
  const table = {
    "What is living inside": aligned("What is living inside", 2),
    "Wild yeasts eat sugar.": aligned("Wild yeasts eat sugar.", 3),
  };

  const Article = () => (
    <SpokenText>
      <h2>What is living inside</h2>
      <p>Wild yeasts eat sugar.</p>
    </SpokenText>
  );

  it("offsets every block's timings onto one document clock", async () => {
    const seen = held();
    render(
      <SpokenTextProvider fetchAlignment={from(table)}>
        <Capture into={seen} />
        <Article />
      </SpokenTextProvider>,
    );

    await waitFor(() =>
      expect(seen.current?.segments.map((s) => s.status)).toEqual([
        "ready",
        "ready",
      ]),
    );

    expect(seen.current?.segments.map((s) => [s.start, s.end])).toEqual([
      [0, 4],
      [4, 8],
    ]);
    // The second block starts where the first one ends: 2 seconds in.
    expect(seen.current?.words.map((w) => w.start)).toEqual([
      0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5,
    ]);
    expect(seen.current?.duration).toBe(5);
    expect(seen.current?.durationIsEstimate).toBe(false);
  });

  it("fetches a block when a word in it is clicked, and plays from there", async () => {
    let release = () => {};
    const paragraph = new Promise<void>((resolve) => {
      release = resolve;
    });

    const seen = held();
    const { container } = render(
      <SpokenTextProvider
        fetchAlignment={async (text) => {
          if (text !== "What is living inside") await paragraph;
          return table[text as keyof typeof table];
        }}
      >
        <Capture into={seen} />
        <Article />
      </SpokenTextProvider>,
    );

    await waitFor(() => expect(seen.current?.status).toBe("ready"));
    expect(seen.current?.audioUrl).toBe(
      aligned("What is living inside").audioUrl,
    );

    // "eat" sits in a paragraph nothing has asked for yet.
    fireEvent.click(container.querySelector('[data-spoken-index="6"]')!);
    release();

    await waitFor(() =>
      expect(seen.current?.audioUrl).toBe(
        aligned("Wild yeasts eat sugar.").audioUrl,
      ),
    );
    expect(seen.current?.currentWordIndex).toBe(6);
    // Two words into the paragraph, not back at the top of the document.
    expect(seen.current?.currentTime).toBe(3);
    act(() => seen.current?.pause());
  });

  it("estimates the blocks that have not landed, then corrects", async () => {
    let release = () => {};
    const held2 = new Promise<void>((resolve) => {
      release = resolve;
    });

    const seen = held();
    render(
      <SpokenTextProvider
        fetchAlignment={async (text) => {
          if (text !== "What is living inside") await held2;
          return table[text as keyof typeof table];
        }}
      >
        <Capture into={seen} />
        <Article />
      </SpokenTextProvider>,
    );

    await waitFor(() => expect(seen.current?.status).toBe("ready"));

    // The heading is real; the paragraph is four words at the reading pace.
    expect(seen.current?.durationIsEstimate).toBe(true);
    expect(seen.current?.duration).toBeCloseTo(2 + 4 / 2.7, 5);
    expect(seen.current?.segments.map((s) => s.status)).toEqual([
      "ready",
      "loading",
    ]);
    // Nothing in an unloaded block is timed, or seekable.
    expect(seen.current?.words.slice(4).every((w) => !w.seekable)).toBe(true);
    expect(seen.current?.words.slice(4).every((w) => w.state === "future")).toBe(
      true,
    );

    release();
    await waitFor(() => expect(seen.current?.durationIsEstimate).toBe(false));
    expect(seen.current?.duration).toBe(5);
  });
});

describe("a block that fails", () => {
  it("is not asked for again until a reader asks", async () => {
    let calls = 0;
    const seen = held();
    render(
      <SpokenTextProvider
        fetchAlignment={async () => {
          calls += 1;
          throw new Error("The route is down.");
        }}
      >
        <Capture into={seen} />
        <SpokenText>
          <p>One two three</p>
        </SpokenText>
      </SpokenTextProvider>,
    );

    await waitFor(() => expect(seen.current?.status).toBe("error"));
    expect(seen.current?.error?.message).toBe("The route is down.");

    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(calls).toBe(1);

    // Pressing play is a fresh attempt.
    act(() => seen.current?.play());
    await waitFor(() => expect(calls).toBe(2));
  });
});

describe("<SpokenTextProvider>", () => {
  it("lets a <Player> anywhere drive a <SpokenText> anywhere", async () => {
    render(
      <SpokenTextProvider
        fetchAlignment={from({ "One two three": aligned("One two three", 65) })}
      >
        <header>
          <Player showStatus={false} />
        </header>
        <article>
          <SpokenText>
            <p>One two three</p>
          </SpokenText>
        </article>
      </SpokenTextProvider>,
    );

    const play = () =>
      screen.getByRole("button", { name: "Play" }) as HTMLButtonElement;

    // The <SpokenText> in the article told the provider what it says, so the
    // <Player> in the header is live before any audio has arrived.
    expect(play().disabled).toBe(false);
    await waitFor(() => expect(screen.getByText("1:05")).toBeTruthy());
  });

  it("marks the time as an estimate until every block has landed", async () => {
    const seen = held();
    render(
      <SpokenTextProvider
        fetchAlignment={from({ "One two three": aligned("One two three") })}
      >
        <Capture into={seen} />
        <Player showStatus={false} />
        <SpokenText>
          <p>One two three</p>
        </SpokenText>
      </SpokenTextProvider>,
    );

    await waitFor(() => expect(seen.current?.status).toBe("ready"));
    expect(screen.getByText("~", { exact: false }).textContent).toContain("~");
  });

  it("honours the options written on the <SpokenText> itself", async () => {
    let calls = 0;
    render(
      <SpokenTextProvider>
        <SpokenText
          debounceMs={120}
          fetchAlignment={async (text) => {
            calls += 1;
            return aligned(text);
          }}
        >
          One two three
        </SpokenText>
      </SpokenTextProvider>,
    );

    // The provider owns the controller, but the debounce was written next to
    // the text, so nothing is asked for until the text has settled.
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(calls).toBe(0);
    await waitFor(() => expect(calls).toBe(1));
  });

  it("self-manages when there is no provider", async () => {
    render(
      <SpokenText
        fetchAlignment={from({ "One two three": aligned("One two three") })}
      >
        <p>One two three</p>
      </SpokenText>,
    );

    await waitFor(() =>
      expect(
        document.querySelector('[data-spoken-index="0"]')?.getAttribute("style"),
      ).toContain("cursor: pointer"),
    );
  });
});

describe("saying what is not on the page", () => {
  /**
   * Two blocks, each with words in them that are said and never shown: an
   * announcement ahead of the heading, and a note in place of the skipped
   * `<code>` in the middle of the sentence.
   *
   * The document's words are, in order: `Section` `1.` `Feeding` `it` /
   * `Pass` `the` `a` `debounce` `setting` `option.` — of which 0, 1, 6, 7 and 8
   * are hidden.
   */
  const say = {
    h2: ({ count }: { count: number }) => ({ before: `Section ${count}.` }),
    code: () => "a debounce setting",
  };

  const Article = () => (
    <SpokenText say={say}>
      <h2>Feeding it</h2>
      <p>
        Pass the <code>debounceMs</code> option.
      </p>
    </SpokenText>
  );

  const table = {
    "Section 1. Feeding it": aligned("Section 1. Feeding it", 2),
    "Pass the a debounce setting  option.": aligned(
      "Pass the a debounce setting option.",
      3,
    ),
  };

  it("renders nothing for the words it adds", () => {
    const { container } = render(<Article />);

    // The page is exactly what was written, and only the words on it are
    // wrapped — with the indices they have in the document.
    expect(container.textContent).toBe("Feeding itPass the debounceMs option.");
    expect(
      [...container.querySelectorAll("[data-spoken-index]")].map((el) => [
        el.getAttribute("data-spoken-index"),
        el.textContent,
      ]),
    ).toEqual([
      ["2", "Feeding"],
      ["3", "it"],
      ["4", "Pass"],
      ["5", "the"],
      ["9", "option."],
    ]);
  });

  it("never hands a hidden word to `renderWord`", () => {
    const seen: number[] = [];
    render(
      <SpokenText
        say={say}
        renderWord={(word) => {
          seen.push(word.index);
          return word.text;
        }}
      >
        <h2>Feeding it</h2>
      </SpokenText>,
    );

    // Deduped, because the loading state renders the heading more than once.
    expect([...new Set(seen)]).toEqual([2, 3]);
  });

  it("times the words on the page as if the hidden ones were there", async () => {
    const seen = held();
    render(
      <SpokenTextProvider fetchAlignment={from(table)}>
        <Capture into={seen} />
        <Article />
      </SpokenTextProvider>,
    );

    await waitFor(() =>
      expect(seen.current?.segments.map((s) => s.status)).toEqual([
        "ready",
        "ready",
      ]),
    );

    // The heading is said in one piece, so "Feeding" starts a second in, after
    // the announcement; and "option." is timed past the note that replaced the
    // `<code>`, not as if the sentence ran straight on.
    expect(seen.current?.words.map((w) => [w.text, w.hidden, w.start])).toEqual([
      ["Section", true, 0],
      ["1.", true, 0.5],
      ["Feeding", false, 1],
      ["it", false, 1.5],
      ["Pass", false, 2],
      ["the", false, 2.5],
      ["a", true, 3],
      ["debounce", true, 3.5],
      ["setting", true, 4],
      ["option.", false, 4.5],
    ]);
    expect(seen.current?.text).toBe(
      "Section 1. Feeding it\n\nPass the a debounce setting  option.",
    );
  });

  it("lights nothing on the page while a hidden word is spoken", async () => {
    const seen = held();
    const changes: (DisplayWord | undefined)[] = [];
    const { container } = render(
      <SpokenTextProvider
        fetchAlignment={from(table)}
        onWordChange={(_, word) => changes.push(word)}
      >
        <Capture into={seen} />
        <Article />
      </SpokenTextProvider>,
    );

    await waitFor(() =>
      expect(seen.current?.segments.map((s) => s.status)).toEqual([
        "ready",
        "ready",
      ]),
    );

    // The note in place of the `<code>`, which is nowhere on the page.
    act(() => seen.current?.seekToWord(6));
    await waitFor(() => expect(seen.current?.currentWordIndex).toBe(6));
    expect(seen.current?.currentWord?.hidden).toBe(true);
    expect(changes.at(-1)?.index).toBe(6);

    expect(container.querySelector('[data-spoken-state="current"]')).toBeNull();
    expect(
      [...container.querySelectorAll("[data-spoken-index]")].map((el) =>
        el.getAttribute("data-spoken-state"),
      ),
    ).toEqual(["past", "past", "past", "past", "future"]);

    // The gap after "the" runs into three hidden words, so it stays dark until
    // the voice is back on the page. The band is otherwise unbroken.
    expect(
      [...container.querySelectorAll("[data-spoken-state]")]
        .filter((el) => !el.hasAttribute("data-spoken-index"))
        .map((el) => el.getAttribute("data-spoken-state")),
    ).toEqual(["past", "past", "future"]);

    act(() => seen.current?.pause());
  });
});
