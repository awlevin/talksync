"use client";

import { useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { SpokenText, Transport, useSpokenText } from "spoken-text";
import { Api, Code, Dim } from "./code";
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

/**
 * The demo, and the code that is running it.
 *
 * Both panes stay mounted and are hidden with CSS rather than unmounted, so
 * an edit to the passage survives a trip through the player-only view and the
 * audio keeps playing while the view changes.
 *
 * What is printed is exactly what is running: no styling props, because the
 * page sets `--spoken-text-current` and friends and the component reads them.
 *
 * The only thing the page adds is a place in the queue: the demo takes the
 * page's voice when it starts, and gives it up when a passage below is asked
 * to speak.
 */
export const LiveExample = () => {
  const [view, setView] = useState<View>("player");
  const [text, setText] = useState(SAMPLE);
  const speech = useSpokenText(text, { debounceMs: 900 });
  useSoleSpeaker(speech);

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
            <Dim>{"import "}</Dim>
            {"{ "}
            <Api>SpokenText</Api>
            {", "}
            <Api>Transport</Api>
            {", "}
            <Api>useSpokenText</Api>
            {" } "}
            <Dim>{'from "spoken-text";'}</Dim>
            {"\n\n"}
            <Dim>{"export default function "}</Dim>
            {"Reader() {"}
            {"\n  "}
            <Dim>{"const"}</Dim>
            {" speech = "}
            <Api>useSpokenText</Api>
            {'("'}
            <span
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
            {'", {'}
            {"\n    debounceMs: 900, "}
            <Dim>{"// wait for typing to settle"}</Dim>
            {"\n  });"}
            {"\n\n  "}
            <Dim>{"return"}</Dim>
            {" ("}
            {"\n    <>"}
            {"\n      <"}
            <Api>SpokenText</Api>
            {" speech={speech} />"}
            {"\n      <"}
            <Api>Transport</Api>
            {" speech={speech} />"}
            {"\n    </>"}
            {"\n  );"}
            {"\n}"}
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
            <SpokenText speech={speech} />
            <div className="mt-auto border-t border-rule pb-5 pt-5 font-mono lg:pb-6">
              <Transport speech={speech} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
