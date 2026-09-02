import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { Mark } from "@/components/Mark";

export const metadata: Metadata = {
  title: "A whole article, read aloud · spoken-text",
  description:
    "One <SpokenTextProvider>, one <SpokenText> around the article, and a <Player> in a sticky bar. Each block is its own alignment request.",
};

export default function ArticlePage() {
  return (
    <div className="mx-auto w-full max-w-page px-5 sm:px-8 lg:px-12">
      <header className="flex items-center justify-between border-b border-rule py-5">
        <a className="flex items-center gap-2.5" href="/">
          <Mark className="h-7 w-7" />
          <span className="font-mono text-[0.9375rem] font-semibold tracking-tight">
            spoken-text
          </span>
        </a>
        <span className="label">Press play, or click any word</span>
      </header>

      <Article />
    </div>
  );
}
