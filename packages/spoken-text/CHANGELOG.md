# spoken-text

## 0.2.0

### Minor Changes

- e49327f: Read a whole document, not just a passage.
  
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
- e13bf4e: The highlight reads as one band rather than a row of tiles. The whitespace
  between two words is now a span of its own, carrying `data-spoken-state` and
  the past colour once the word after it has been reached, and no word box is
  rounded, padded or overlapped on the way. Only the word being spoken is a box
  of its own. `classNames.separator` restyles the gaps.
- e7ba6c2: Say what is not on the page.
  
  - `say` takes a rule per selector and puts words into the audio that are not in
    the markup:
  
    ```tsx
    <SpokenText
      say={{
        h2: ({ count }) => ({ before: `Section ${count}.` }),
        pre: () => "A code sample, skipped.",
        svg: ({ element }) => `A drawing. ${element.props["aria-label"]}`,
      }}
    >
      …
    </SpokenText>
    ```
  
  - `{ before }` and `{ after }` keep the element's own words and speak around
    them; a plain string replaces them. Keys select the way `skip` does, and the
    first one that matches an element wins.
  - The words a rule adds are hidden words: they are in the word list and in the
    text handed to the aligner, at the point the element sits, so everything
    around them stays exactly timed — and nothing is rendered for them.
    `DisplayWord.hidden` marks them, no word on the page is `current` while one is
    spoken, and the highlight band waits for the voice to come back to the page.
- ee1d15b: Speech that brings its own timings, and a kind for every block.
  
  - `elevenlabsSpeech` is a new adapter. One call returns the audio and a
    timestamp for every character, which the adapter groups into words, so there
    is no transcription step and no drift between what was said and what was
    heard. Plain `fetch`, no SDK, no new dependency. Needs `ELEVENLABS_API_KEY`
    (or `ELEVEN_LABS_API_KEY`); defaults to George, a premade voice that works on
    every plan.
  - `SpeechAudio` can carry `words` and `duration`, and `transcribe` is now
    optional. Supply neither and the handler says so, naming both ways out.
  - Every block carries a `kind` — `"heading"`, `"paragraph"`, `"list"` or
    `"quote"` — from the tag it was written as. The client sends
    `{ content, kind }`, the handler passes it to `speech` and to `hash`, and
    `segments[].kind` reports it. `openaiSpeech` takes `instructions` as a
    function of the kind; `elevenlabsSpeech` takes `voiceSettings` the same way.
  - `FetchAlignment` is now `(text, { kind }) => Promise<Alignment>` and `hash` is
    now `(text, kind) => string`. An adapter written as `(text) => …` still fits;
    a `hash` you wrote yourself keeps working and simply ignores the kind.
  
  **Cache note:** the default hash covers the kind as well as the text, so
  existing entries are missed once and regenerated.
- e13bf4e: Options written on a `<SpokenText>` inside a `<SpokenTextProvider>` are honoured
  rather than ignored. The provider's own options are the defaults, so a
  `debounceMs` can sit next to the text it is about.
