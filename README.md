![spoken-text](https://raw.githubusercontent.com/awlevin/spoken-text/main/docs/banner.png)

# spoken-text

_One React component reads your text aloud and lights each word as it is said._

![spoken-text in action](https://raw.githubusercontent.com/awlevin/spoken-text/main/docs/demo.gif)

Live demo at [spoken-text.vercel.app](https://spoken-text.vercel.app).

```bash
npm install spoken-text
```

React 18 or 19 is the only requirement. No icon library, no data-fetching
library, nothing else.

## Usage

```tsx
import { SpokenText } from "spoken-text";

<SpokenText>Any text you like.</SpokenText>;
```

That is the whole thing. `SpokenText` sends the text to `/api/transcription`,
gets back an audio file and word-level timestamps, and highlights each word at
the moment it is spoken. Click any word to hear the passage from there.

That route is yours to mount. It is one line: see
[Mounting the route](#mounting-the-route) below.

### A whole document

Hand it elements instead of a string and it reads the lot:

```tsx
<SpokenText>
  <h2>What is living in there</h2>
  <p>Wild yeasts eat the sugars in the flour…</p>
  <h2>Feeding it</h2>
  <p>One part starter, five parts flour, five parts water…</p>
</SpokenText>
```

The structure is kept: an `h2` stays an `h2`, a link stays a link, only text is
wrapped. Each heading, paragraph, list item and blockquote is its **own**
alignment request, so each caches on its own, the first is fetched on mount,
the next is warmed while the current one plays, and clicking a word in a block
nobody has asked for yet fetches it and starts there.

`currentWordIndex` is one number across the whole document, and `segments` says
where each block begins and ends. A string is a document with one block, so
nothing about a single passage changes.

> The walk sees the elements you hand it, not inside a child component.
> `<SpokenText><MyArticle /></SpokenText>` cannot see the text inside
> `MyArticle`. MDX output and hand-written pages are both fine.

### A player anywhere on the page

`<SpokenTextProvider>` holds the controller, so the play button does not have to
be a sibling of the text:

```tsx
import { Player, SpokenText, SpokenTextProvider } from "spoken-text";

<SpokenTextProvider>
  <header className="sticky top-0">
    <Player />
  </header>

  <article>
    <SpokenText>{/* the whole document */}</SpokenText>
  </article>
</SpokenTextProvider>;
```

One document per provider. Without a provider, `<SpokenText>` manages itself and
`<Player>` takes a `speech` prop:

```tsx
import { Player, SpokenText, useSpokenText } from "spoken-text";

function Reader({ text }: { text: string }) {
  const speech = useSpokenText(text);
  return (
    <>
      <SpokenText speech={speech} />
      <Player speech={speech} />
    </>
  );
}
```

`useSpokenText` on its own is headless. It owns the audio and reports which
word is being spoken, so you can build whatever UI you like on top of it.

### Leaving things unspoken

Code read aloud as prose is noise, and it would wreck the alignment besides. So
`code`, `pre`, `kbd`, `samp`, `var`, `script`, `style`, `svg`, `canvas`,
`iframe` and `math` are skipped by default.

Skipped content still renders, untouched, exactly where it is. It is dropped
only from the text handed to the aligner, so an inline `<code>` in the middle of
a sentence leaves a gap in what is said and the words on either side stay
correctly timed.

```tsx
<SpokenText skip={["code", "pre", "figcaption", ".footnote"]}>…</SpokenText>
<SpokenText skip={(el) => el.type === "aside"}>…</SpokenText>
<SpokenText only={[".prose"]}>…</SpokenText>
```

Both props take an array of selectors — a tag (`"pre"`), a class
(`".footnote"`), an attribute (`"[aria-hidden]"`) — or a predicate over the
React element. `only` fences the field; `skip` cuts inside it. Per element,
`data-spoken` and `data-spoken-skip` do the same job at the point of authorship,
which is what you want in MDX.

Headings are read. `skip={["h1", "h2", "h3"]}` is the opt-out.

### `<SpokenText>`

| Prop              | Type                                          | Default                | What it does                                                                              |
| ----------------- | --------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------- |
| `children`        | `string \| ReactNode`                         |                        | A passage, or a tree of elements. Each block becomes its own alignment request.             |
| `speech`          | `SpokenTextController`                        |                        | A controller from `useSpokenText`. Left out, it reads a provider, or else manages itself.   |
| `skip`            | `(string \| ((el) => boolean))[]`             | `DEFAULT_SKIP`         | Parts of the tree to leave unspoken. They still render.                                     |
| `only`            | `(string \| ((el) => boolean))[]`             |                        | Speak only these parts of the tree. Unset means all of it.                                  |
| `as`              | `"p" \| "div" \| "span" \| …`                | `"div"` / `"p"`        | Element it renders into: `div` for a tree, `p` for a string.                                |
| `className`       | `string`                                      |                        | Class on that element.                                                                      |
| `classNames`      | `{ word, past, current, future, separator }`  |                        | Classes for the words and for the gaps between them. Setting one drops the built-in look for that slot, so your CSS wins. |
| `renderWord`      | `(word: DisplayWord) => ReactNode`            |                        | Render words yourself. Whitespace is still inserted for you.                                |
| `seekOnWordClick` | `boolean`                                     | `true`                 | Click a word to play from there, fetching its block if it has not been asked for.           |
| `endpoint`        | `string`                                      | `"/api/transcription"` | Route that turns text into audio and timings.                                               |
| `fetchAlignment`  | `(text, { kind }) => Promise<Alignment>`      |                        | Skip `endpoint` and resolve the alignment however you like.                                 |
| `onWordChange`    | `(index: number, word?: DisplayWord) => void` |                        | Fires when the spoken word changes. `-1` means nothing is spoken yet.                       |
| `debounceMs`      | `number`                                      | `0`                    | Wait this long after `children` stops changing before fetching. Useful behind a textarea.   |
| `autoPlay`        | `boolean`                                     | `false`                | Start speaking as soon as the audio is ready.                                               |

Every word also carries `data-spoken-state="past" | "current" | "future"` and
`data-spoken-index`, so plain CSS can style the highlight without any props.
The whitespace between two words is a span of its own, carrying the same
`data-spoken-state`: it is lit once the word after it has been reached, so the
highlight is one continuous band rather than a row of boxes.

### `<SpokenTextProvider>`

Takes the same options as the hook (`endpoint`, `fetchAlignment`,
`onWordChange`, `debounceMs`, `autoPlay`) and applies them to the whole
document. Anything written on the `<SpokenText>` inside it wins, so a
`debounceMs` can sit next to the text it is about. `useSpokenTextController()`
returns the controller it is holding, for building a player of your own.

### `<Player>`

| Prop         | Type                                                    | Default | What it does                                          |
| ------------ | ------------------------------------------------------- | ------- | ------------------------------------------------------ |
| `speech`     | `SpokenTextController`                                  |         | The controller to drive. Left out, it reads a provider. |
| `className`  | `string`                                                |         | Class on the wrapper.                                   |
| `classNames` | `{ root, button, track, elapsed, thumb, time, status }` |         | Per-part classes, same "your class wins" rule.          |
| `showTime`   | `boolean`                                               | `true`  | Show elapsed / total time.                              |
| `showStatus` | `boolean`                                               | `true`  | Show the loading and error line.                        |

While blocks are still loading the total is an estimate, and the player says so:
`~1:42`, dimmed, correcting itself as the audio lands.

### `useSpokenText(text, options?)`

Takes the same options as `SpokenText` (`endpoint`, `fetchAlignment`,
`onWordChange`, `debounceMs`, `autoPlay`). Pass `null` as the text to switch it
off. It returns:

| Field                                       | What it is                                                          |
| ------------------------------------------- | ------------------------------------------------------------------- |
| `words`                                     | `DisplayWord[]`: text, index, `past \| current \| future`, timings  |
| `currentWordIndex`, `currentWord`           | The word being spoken, across the document, or `-1` / `undefined`    |
| `segments`                                  | `{ start, end, kind, status }[]`: one per block, over `words`         |
| `status`, `isLoading`, `isPlaying`, `error` | What it is doing right now                                           |
| `currentTime`, `duration`, `audioUrl`       | Playback position and source                                         |
| `durationIsEstimate`                        | True while `duration` still counts unloaded blocks at a reading pace |
| `play`, `pause`, `toggle`                   | Playback                                                             |
| `seek`, `seekToWord`, `seekToFraction`      | Move the playhead, anywhere in the document                          |
| `getAudioElement`                           | The underlying `Audio`, for anything the API misses                  |

`alignTokens`, `tokenize`, `normalizeForAlignment` and `tokenIndexAt` are
exported too, if you want the alignment without the components.

## Mounting the route

The client half needs somewhere to send text. `spoken-text/server` gives you
that route in one line:

```ts
// app/api/transcription/route.ts
import {
  createAlignmentHandler,
  elevenlabsSpeech,
  vercelBlobCache,
} from "spoken-text/server";

export const POST = createAlignmentHandler({
  speech: elevenlabsSpeech(),
  cache: vercelBlobCache(),
});
```

That is the whole route. ElevenLabs returns the audio and a timestamp for every
character of the text in one call, so there is nothing to transcribe and nothing
to drift: the timings are the model's own record of what it said.

`createAlignmentHandler` returns a plain `(Request) => Promise<Response>`, so it
mounts in a Next.js route handler, a Hono route, a Deno server: anywhere the
web standard is spoken.

`elevenlabsSpeech` needs `ELEVENLABS_API_KEY` (or `ELEVEN_LABS_API_KEY`) in the
environment, or an `apiKey` passed to it. It defaults to George, a premade
voice. Premade voices work on every plan, including the free tier; the voice
library needs a paid one.

| Option          | Default                            | What it does                                    |
| --------------- | ---------------------------------- | ----------------------------------------------- |
| `voiceId`       | `"JBFqnCBsd6RMkjVDRZzb"` (George)  | Any voice you can reach on your plan.            |
| `modelId`       | `"eleven_multilingual_v2"`         |                                                  |
| `outputFormat`  | `"mp3_44100_128"`                  | The content type follows from it.                |
| `voiceSettings` |                                    | `stability`, `similarity_boost`, `style`, `speed`, `use_speaker_boost` — or a function of the block's kind. |
| `apiKey`        | `ELEVENLABS_API_KEY`               |                                                  |

### With OpenAI instead

`tts-1` hands back an MP3 and nothing else, so it needs `whisper-1` to read the
timings back off the recording. Two model calls rather than one, and the two
can disagree — see [How words are matched to
timings](#how-words-are-matched-to-timings):

```ts
import { openaiSpeech, openaiTranscription } from "spoken-text/server";

export const POST = createAlignmentHandler({
  speech: openaiSpeech({
    model: "gpt-4o-mini-tts",
    voice: "nova",
    instructions: (kind) =>
      kind === "heading" ? "Announce it, then pause." : "Read it warmly.",
  }),
  transcribe: openaiTranscription({ model: "whisper-1", language: "en" }),
  cache: vercelBlobCache(),
});
```

### What each block is

Every block says what it is, so a voice can read a title like a title. The
client sends `{ content, kind }`, where `kind` is `"heading"`, `"paragraph"`,
`"list"` or `"quote"`, and the handler passes it on:

```ts
speech: elevenlabsSpeech({
  voiceSettings: (kind) =>
    kind === "heading" ? { speed: 0.9, stability: 0.6 } : undefined,
}),
```

Headings are `h1`–`h6`, list items are `li`, quotes are `blockquote`, and
everything else is a paragraph. A block that does not say what it is — a `p`, a
`div` — keeps the kind it sits inside, so the paragraph markdown puts inside a
blockquote is still read as a quote. `kind` is part of the cache key, so the
same words as a heading and as a paragraph are two recordings.

`segments[].kind` reports it on the client, and `kind` reaches the request
body of your own `fetchAlignment` too.

### The adapters are optional

Nothing in the package requires ElevenLabs, OpenAI or Vercel. `speech`,
`transcribe` and `cache` are yours to supply, and the bundled adapters are
opt-in helpers that import their dependencies only when called:

| Adapter                               | Needs                                                    |
| ------------------------------------- | -------------------------------------------------------- |
| `elevenlabsSpeech`                    | `ELEVENLABS_API_KEY`. No package: it is one `fetch`.       |
| `openaiSpeech`, `openaiTranscription` | `ai`, `@ai-sdk/openai`, and `OPENAI_API_KEY`               |
| `vercelBlobCache`                     | `@vercel/blob`, and `BLOB_READ_WRITE_TOKEN`                |

Install only the ones you use. They are optional peer dependencies, so nothing
is pulled in on your behalf.

Writing your own is small. Return `words` from `speech` if your model times its
own output, and leave `transcribe` out:

```ts
export const POST = createAlignmentHandler({
  speech: async (text, { kind }) => ({
    audio: await myTts(text, kind), // a Uint8Array
    contentType: "audio/mpeg",
    words: [{ text: "Hello", start: 0, end: 0.42 }, /* … */],
    duration: 3.1,
  }),
  cache: {
    get: (hash) => redis.get(`speech:${hash}`),
    set: async (hash, audio, words, duration) => {
      const audioUrl = await s3.put(hash, audio.audio, audio.contentType);
      const entry = { audioUrl, words, duration };
      await redis.set(`speech:${hash}`, entry);
      return entry;
    },
  },
});
```

If it does not, add a `transcribe` and the handler asks it instead:

```ts
transcribe: async ({ audio }) => ({
  words: await myAligner(audio), // [{ text, start, end }, …]
}),
```

Supply neither and the handler tells you so, by name, on the first request.

Other options: `maxLength` (default `2000` characters), `hash`
(`(text, kind) => string`, default the SHA-256 of both, which you can override
to fold the voice or model into the key) and `onError`.

## How the audio is made and cached

`elevenlabsSpeech` does one call: the audio comes back with a timestamp for
every character, and those characters are grouped into words. Reading the
timings off the generated audio, rather than guessing them from the text, is
what keeps the highlight honest — and taking them from the model that did the
speaking means there is no second opinion to disagree with.

`openaiSpeech` cannot do that, so it takes two calls: `tts-1` turns the text
into an MP3, then `whisper-1` transcribes that MP3 back with word-level
timestamps. See [How words are matched to
timings](#how-words-are-matched-to-timings) for what that costs.

A model call per passage is slow and not free, so nothing is generated twice.
The passage and its kind are hashed with SHA-256 and handed to your `cache`,
which is asked first on every request. With `vercelBlobCache` the audio and the timings land at
`spoken-text/<hash>/audio` and `spoken-text/<hash>/alignment.json`. Identical
text anywhere, by anyone, is a cache hit and comes back in milliseconds. On the
client, the same passage is only ever fetched once per page: two components
sharing a passage share one request, and remounting one resolves from memory.

The cache is content-addressed and never invalidated, which is fine because the
key covers the entire input. Change a comma, or make a paragraph a heading, and
you get a new hash and a new recording. Change the *voice*, though, and the key
does not move on its own, so pass a `hash` that includes it if you switch voices
at runtime.

Leave `cache` out entirely and every request regenerates the audio and returns it
inline as a `data:` URL. That is fine for a first look and far too slow and
expensive for anything else.

## How words are matched to timings

This is the transcriber's problem, and `elevenlabsSpeech` does not have it: its
timings are already per character of the text you sent, so the words it reports
are the words you wrote. It matters when `speech` returns no timings and a
`transcribe` fills them in.

Whisper does not tokenize on whitespace, so the words you render and the words it
heard are two different lists. `State-of-the-art tools cost $1,200 per seat,
e.g. Figma or Sketch.` is ten whitespace-separated tokens and fifteen Whisper
words. Pairing them by position makes the highlight run ahead and then fall off
the end of the passage.

`alignTokens` aligns the two lists instead of zipping them. Both sides are
reduced to their letters and digits for comparison only (casefolded, punctuation
and digit grouping dropped, accents folded); the strings you see are always the
ones you typed. It then walks both lists at once, growing whichever side is
behind until the two spell the same thing, so one token can absorb several
Whisper words and several tokens can share one:

| You wrote          | Whisper heard            | Result                  |
| ------------------ | ------------------------ | ----------------------- |
| `State-of-the-art` | `State` `of` `the` `art` | one span, 0.00s – 0.72s |
| `$1,200`           | `1` `200`                | one span, 1.34s – 1.98s |
| `e.g.`             | `e` `g`                  | one span, 2.96s – 3.10s |
| `400,000`          | `400` `000`              | one span, 2.46s – 3.60s |
| `p.m.`             | `p` `m`                  | one span, 1.86s – 2.28s |
| `peanut` `butter`  | `peanutbutter`           | both share the one span |

When the two disagree it looks a short way ahead on both sides for the next place
they agree and carries on from there, so a word Whisper drops or invents costs
you that one word rather than the rest of the passage. A span is only ever
assigned on an exact match, so a token that cannot be placed comes back untimed
(unhighlighted and not clickable) rather than wrong. The highlight index is
always an index into the rendered passage, so it cannot run off the end.

The test suite works from real `whisper-1` output captured from the deployed
route.

## Known limitations

**Everything here is about the transcribed path.** A `speech` that returns its
own `words` — `elevenlabsSpeech` does — has none of these problems, because
nothing is being matched.

**Words respoken as different words are not matched.** The alignment compares
letters and digits, so it only works when the transcriber spells a token the way
you did. If the speech model reads something aloud and the transcriber writes it
back differently (a symbol read as a word, a unit expanded, a number
transcribed as `twelve hundred` rather than `1,200`), that token stays untimed
and the highlight steps over it, picking back up at the next word the two agree
on. In practice `tts-1` and `whisper-1` agree on ordinary English text, including
the money, dates, abbreviations and hyphenated compounds in the table above.

**Repeated words next to a mismatch can resync onto the wrong one.** The search
for the next agreement looks eight entries ahead on each side and takes the
nearest match, which is not always the right one in a passage that repeats itself
heavily right where the transcript went astray.

**Tokens that share one transcribed word light up together.** When two words are
run into one there is only one timestamp to go around, so both are highlighted
for the whole of it.

**Transcribers sometimes report a zero-length word.** `boats` and `mud` in the
sample passage both come back with `start === end`. Those words flash rather than
hold. That comes from the transcript, not from the alignment.

**A child component is a closed box.** React children are opaque until they are
rendered, so the walk sees the elements you hand it and nothing inside a
component of your own. `<SpokenText><MyArticle /></SpokenText>` reads nothing.
MDX output is fine, because MDX hands you real `h2` and `p` elements.

Other things worth knowing: the alignment is tuned for English, the handler caps
the input at 2,000 characters per block by default, and the first block takes a
while on a cache miss because the audio has to be made before anything plays.

## Repository

| Path                    | What it is                                    |
| ----------------------- | --------------------------------------------- |
| `packages/spoken-text/` | The published package                          |
| `apps/demo/`            | The Next.js demo site                          |

The demo depends on the workspace package and imports from `spoken-text`, never
from a relative path, so breaking the public API breaks its build.

```bash
pnpm install
pnpm build       # builds the package, then the demo
pnpm test        # Vitest
pnpm typecheck
pnpm lint
pnpm dev         # the demo on http://localhost:3000
```

Changes are released with [Changesets](https://github.com/changesets/changesets).
Add one with `pnpm changeset`; merging the version PR it opens publishes to npm.

## License

MIT © Aaron Levin
