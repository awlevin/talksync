"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { AudioWidget } from "@/components/widget";
import { CONTENT_SAMPLE } from "@/hooks";

export default function HomePage() {
  const [content, setContent] = useState(CONTENT_SAMPLE);

  return (
    <div className="space-y-6">
      <div className="max-w-2xl mx-auto">
        <Input
          onChange={(e) => setContent(e.target.value)}
          value={content}
          placeholder="Type something to read aloud…"
        />
      </div>

      <div className="max-w-2xl mx-auto">
        <AudioWidget content={content} />
      </div>
    </div>
  );
}
