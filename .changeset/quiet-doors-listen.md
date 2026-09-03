---
"spoken-text": minor
---

Speech that brings its own timings, and a kind for every block.

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
