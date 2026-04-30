"use client";
import { useState } from "react";
import { AudioWidget } from "@/components/widget";
import { CONTENT_SAMPLE } from "@/hooks";

export default function HomePage() {
  const [content, setContent] = useState(CONTENT_SAMPLE);

  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">TalkSync</h1>
        <p className="text-muted-foreground">
          Type some text and follow along — words highlight as they&apos;re spoken.
        </p>
      </header>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        maxLength={2000}
        placeholder="Type something to read aloud…"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      <AudioWidget content={content} />
    </main>
  );
}
