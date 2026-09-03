"use client";

import { useState, type ClipboardEvent, type KeyboardEvent } from "react";
import {
  Player,
  SpokenText,
  SpokenTextProvider,
  useSpokenTextController,
} from "spoken-text";
import { Code } from "./code";
import { useSoleSpeaker } from "./Talkable";

const SAMPLE =
  "The tide came in slowly that morning, and the boats leaned over in the mud until the water found them again. By noon the harbour was full, and nobody could remember what the bottom looked like.";

/** What the panel is showing. The player alone is the point, so it leads. */
type View = "player" | "code" | "both";

const VIEWS: { id: View; label: string }[] = [
  { id: "player", label: "Player" },
  { id: "code", label: "Code" },
  { id: "both", label: "Both" },
];

const ViewSwitch = ({
  view,
  onChange,
}: {
  view: View;
  onChange: (view: View) => void;
}) => (
  <div className="seg" role="group" aria-label="What the demo shows">
    {VIEWS.map((option) => (
      <button
        key={option.id}
        type="button"
        aria-pressed={view === option.id}
        onClick={() => onChange(option.id)}
      >
        {option.label}
      </button>
    ))}
  </div>
);

/** The demo takes the page's voice, and gives it up when a passage below asks. */
const TakesTurns = () => {
  useSoleSpeaker(useSpokenTextController());
  return null;
};

/** The snippet, on either side of the passage the reader can edit. */
const BEFORE = `import { Player, SpokenText, SpokenTextProvider } from "spoken-text";

export default function Reader() {
  return (
    <SpokenTextProvider>
      <SpokenText debounceMs={900}>
        `;

const AFTER = `
      </SpokenText>
      <Player />
    </SpokenTextProvider>
  );
}`;

/**
 * The demo, and the code that is running it.
 *
 * Both panes stay mounted and are hidden with CSS rather than unmounted, so
 * an edit to the passage survives a trip through the player-only view and the
 * audio keeps playing while the view changes.
 *
 * What is printed is exactly what is running: the provider holds the
 * controller, so the text and the player are two siblings that never mention
 * each other. No styling props either, because the page sets
 * `--spoken-text-current` and friends and the component reads them.
 */
export const LiveExample = () => {
  const [view, setView] = useState<View>("player");
  const [text, setText] = useState(SAMPLE);

  const showCode = view !== "player";
  const showPlayer = view !== "code";
  const both = view === "both";

  const blockNewlines = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "Enter") event.preventDefault();
  };

  const pastePlainText = (event: ClipboardEvent<HTMLSpanElement>) => {
    event.preventDefault();
    const plain = event.clipboardData.getData("text/plain").replace(/\s+/g, " ");
    document.execCommand("insertText", false, plain);
  };

  return (
    <SpokenTextProvider>
      <TakesTurns />
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5 sm:px-5">
          <span className="path min-w-0 truncate">
            {showCode ? "app/reader.tsx" : "what it renders"}
            {showCode ? (
              <span className="hidden sm:inline"> · editable</span>
            ) : null}
          </span>
          <ViewSwitch view={view} onChange={setView} />
        </div>

        <div
          className={`grid grid-cols-1 ${both ? "lg:grid-cols-[1.02fr_1fr]" : ""}`}
        >
          <div className={showCode ? "min-w-0" : "hidden"}>
            <Code>
              {BEFORE}
              <span
                key="passage"
                role="textbox"
                aria-label="Passage to speak"
                tabIndex={0}
                contentEditable
                suppressContentEditableWarning
                spellCheck={false}
                onKeyDown={blockNewlines}
                onPaste={pastePlainText}
                onInput={(event) =>
                  setText(event.currentTarget.textContent?.trim() ?? "")
                }
                className="rounded-[2px] underline decoration-accent decoration-dotted decoration-2 underline-offset-4 outline-none focus:bg-lit/25 focus:decoration-solid"
                style={{ caretColor: "hsl(var(--accent))" }}
              >
                {SAMPLE}
              </span>
              {AFTER}
            </Code>
          </div>

          <div
            className={
              showPlayer
                ? both
                  ? "border-t border-rule lg:border-l lg:border-t-0"
                  : ""
                : "hidden"
            }
          >
            <div
              className={`mx-auto flex h-full min-h-[17rem] w-full flex-col px-4 pt-5 leading-[1.7] sm:min-h-[19rem] sm:px-5 lg:px-7 lg:pt-6 ${
                both
                  ? "max-w-[52ch] text-[1.1875rem] sm:text-[1.3125rem]"
                  : "max-w-[64ch] text-[1.3125rem] sm:text-[1.5rem]"
              }`}
            >
              <SpokenText debounceMs={900}>{text}</SpokenText>
              <div className="mt-auto border-t border-rule pb-5 pt-5 font-mono lg:pb-6">
                <Player />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SpokenTextProvider>
  );
};
