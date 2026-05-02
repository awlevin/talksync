"use client";
import { useState } from "react";
import { AudioWidget } from "@/components/widget";
import { CONTENT_SAMPLE } from "@/hooks";

export default function HomePage() {
  const [content, setContent] = useState(CONTENT_SAMPLE);

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

        <AudioWidget content={content} />
      </section>

      <footer className="mt-auto flex items-center justify-between border-t border-border pt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        <span>TalkSync</span>
        <span className="hidden sm:inline">Read aloud, follow along</span>
        <span aria-hidden>&#8212;</span>
      </footer>
    </main>
  );
}
