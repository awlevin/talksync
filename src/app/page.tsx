"use client";
import { useState } from "react";
import { SpokenText, Transport, useSpokenText } from "@/spoken-text";

const SAMPLE =
  "The historical thinking skill of contextualization involves having students place an event in its proper historical context. To demonstrate this historical thinking skill, students should be able to understand an event or document in relation to what else was happening at the same time or within the same time period. It is a difficult skill because students actually have to explain what was going on during the period, and they should be able to identify key people and events.";

export default function HomePage() {
  const [content, setContent] = useState(SAMPLE);
  const speech = useSpokenText(content, { debounceMs: 600 });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 pt-20 pb-16 sm:px-8">
      <header className="rise-in mb-16 space-y-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
          A Reading Companion · Vol. 01
        </p>
        <h1 className="font-display text-7xl font-light leading-[0.95] tracking-[-0.02em] sm:text-8xl">
          Talk
          <span className="font-normal italic text-accent">Sync</span>
          <span className="text-accent">.</span>
        </h1>
        <p className="max-w-md text-lg italic leading-snug text-muted-foreground">
          Type a passage. Listen along. The words light up as they&rsquo;re
          spoken — tap any one to hear it from there.
        </p>
      </header>

      <section className="rise-in space-y-12" style={{ animationDelay: "120ms" }}>
        <div>
          <label
            htmlFor="manuscript"
            className="mb-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground"
          >
            <span>Manuscript</span>
            <span className="tabular-nums">
              {content.length.toLocaleString()} / 2,000
            </span>
          </label>
          <textarea
            id="manuscript"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="Begin typing&hellip;"
            className="w-full resize-none border-0 border-b border-border bg-transparent pb-3 font-serif text-lg leading-relaxed text-foreground transition-colors placeholder:italic placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none"
          />
        </div>

        <div className="space-y-10">
          <SpokenText
            speech={speech}
            className="font-serif text-[1.375rem] leading-[1.55] text-foreground sm:text-2xl"
            classNames={{
              word: "rounded-[2px] -mx-[0.05em] px-[0.05em] transition-colors duration-200",
              past: "bg-highlight/40 hover:bg-highlight/60",
              current:
                "bg-highlight shadow-[inset_0_-0.12em_0_hsl(var(--accent))]",
              future: "hover:bg-highlight/60",
            }}
          />

          <Transport
            speech={speech}
            classNames={{
              root: "space-y-3",
              button:
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-foreground bg-transparent text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-25",
              track: "relative h-px w-full bg-border",
              elapsed: "bg-foreground",
              thumb: "h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground",
              time: "whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums text-muted-foreground",
              status: speech.error
                ? "flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-destructive"
                : "flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground",
            }}
          />
        </div>
      </section>

      <footer className="mt-auto flex items-center justify-between border-t border-border pt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        <span>TalkSync</span>
        <span className="hidden sm:inline">Read aloud, follow along</span>
        <span aria-hidden>&#8212;</span>
      </footer>
    </main>
  );
}
