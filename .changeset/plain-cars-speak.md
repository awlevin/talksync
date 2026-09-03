---
"spoken-text": minor
---

Say what is not on the page.

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
