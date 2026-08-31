"use client";

import { useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { SpokenText, Transport, useSpokenText } from "spoken-text";
import { Api, Code, Dim, Pane } from "./code";

const SAMPLE =
  "The tide came in slowly that morning, and the boats leaned over in the mud until the water found them again. By noon the harbour was full, and nobody could remember what the bottom looked like.";

/**
 * The example and its result, side by side, with the string literal in the
 * snippet left editable — edit the code and the passage beside it says the new
 * words. What is printed is exactly what is running: no styling props, because
 * the page sets `--spoken-text-current` and friends and the component reads
 * them on its own.
 */
export const LiveExample = () => {
  const [text, setText] = useState(SAMPLE);
  const speech = useSpokenText(text, { debounceMs: 900 });

  const blockNewlines = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "Enter") event.preventDefault();
  };

  const pastePlainText = (event: ClipboardEvent<HTMLSpanElement>) => {
    event.preventDefault();
    const plain = event.clipboardData.getData("text/plain").replace(/\s+/g, " ");
    document.execCommand("insertText", false, plain);
  };

  return (
    <div className="panel grid grid-cols-1 overflow-hidden lg:grid-cols-[1.02fr_1fr]">
      <Pane file="app/reader.tsx" note="Editable">
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
            className="rounded-[2px] underline decoration-amber decoration-dotted decoration-2 underline-offset-4 outline-none focus:bg-amber/20 focus:decoration-solid"
            style={{ caretColor: "hsl(var(--rust))" }}
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
      </Pane>

      <Pane
        file="what it renders"
        note={speech.isPlaying ? "Playing" : undefined}
        className="border-t border-rule lg:border-l lg:border-t-0"
      >
        <div className="flex h-full flex-col px-4 pt-5 text-[1.1875rem] leading-[1.7] sm:px-5 sm:text-[1.3125rem] lg:px-7 lg:pt-6">
          <SpokenText speech={speech} />
          <div className="mt-auto border-t border-rule pb-5 pt-5 font-mono lg:pb-6">
            <Transport speech={speech} />
          </div>
        </div>
      </Pane>
    </div>
  );
};
