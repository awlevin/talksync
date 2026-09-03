"use client";

import type { ReactNode } from "react";
import { Player, SpokenText, SpokenTextProvider } from "spoken-text";

/**
 * The docs read themselves.
 *
 * Every MDX page is wrapped in this, so the prose on it is one document with
 * one playhead and one player. MDX is what makes it possible: the page hands
 * over real `h2` and `p` elements rather than a component of its own, which is
 * the one thing the walk cannot see through.
 *
 * Snippets are skipped, so what you hear is the writing and not the code.
 * Inline `code` is on the default skip list; a fence arrives as the `div` the
 * `pre` mapping renders, which carries `data-spoken-skip`, and so do the
 * reference tables. Nothing has to be listed here.
 */
export const DocsArticle = ({ children }: { children: ReactNode }) => (
  <SpokenTextProvider>
    <div className="sticky top-0 z-10 -mx-5 border-b border-rule bg-bg/90 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-3 lg:px-3">
      {/* Restyled through `classNames`, which is the hatch the styling page is
          about: a smaller button than the article's, in a bar of fixed height. */}
      <Player
        className="font-mono"
        classNames={{ root: "docs-player", button: "docs-player-button" }}
      />
    </div>

    <article className="docs pb-10 pt-8">
      <SpokenText>{children}</SpokenText>
    </article>
  </SpokenTextProvider>
);
