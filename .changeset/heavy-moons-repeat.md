---
"spoken-text": minor
---

Read a whole document, not just a passage.

- `<SpokenText>` accepts elements as well as a string. It walks the tree,
  wraps the words and leaves the structure alone: an `h2` stays an `h2`, a link
  stays a link.
- Each heading, paragraph, list item and blockquote is its own alignment
  request. The first is fetched on mount, the next is warmed while the current
  one plays, and clicking a word in a block nobody has asked for yet fetches it
  and plays from there. `currentWordIndex` is one index across the document, and
  `segments` says where each block begins and ends.
- `duration` counts unloaded blocks at a reading pace until their audio lands,
  and `durationIsEstimate` says when it is doing so. `<Player>` shows the total
  dimmed, with a tilde, while it is a guess.
- `<SpokenTextProvider>` holds the controller, so `<Player>` can live in a
  sticky header rather than next to the text. `useSpokenTextController()` reads
  it, for building a player of your own.
- `skip` and `only` decide what is spoken, taking a tag, a `.class`, an
  `[attr]`, or a predicate over the React element. `data-spoken` and
  `data-spoken-skip` are the per-element forms. Skipped content still renders
  where it was written and is dropped only from the text handed to the aligner,
  so the words either side of an inline `<code>` stay correctly timed.

**Breaking:** `<Transport>` is now `<Player>`, and `TransportProps` /
`TransportClassNames` are `PlayerProps` / `PlayerClassNames`. Same component,
better name; there is no alias.
