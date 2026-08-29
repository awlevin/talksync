![TalkSync](docs/banner.png)

# TalkSync

_Wrap your text in one component, hear it read aloud, and watch each word light up as it is spoken._

![TalkSync in action](docs/demo.gif)

Live at [talksync-six.vercel.app](https://talksync-six.vercel.app).

## Usage

```tsx
import { SpokenText } from "@/spoken-text";

<SpokenText>Any text you like.</SpokenText>;
```

That is the whole thing. `SpokenText` sends the text to `/api/transcription`,
gets back an MP3 and word-level timestamps, and highlights each word at the
moment it is spoken. Click any word to hear the passage from there.
`src/app/example/page.tsx` is that snippet as a page you can actually load.

If you want a play button and a scrubber, hold the controller yourself and put
a `Transport` next to it:

```tsx
import { SpokenText, Transport, useSpokenText } from "@/spoken-text";

function Reader({ text }: { text: string }) {
  const speech = useSpokenText(text);
  return (
    <>
      <SpokenText speech={speech} />
      <Transport speech={speech} />
    </>
  );
}
```

`useSpokenText` on its own is headless — it owns the audio and reports which
word is being spoken, so you can build whatever UI you like on top of it.

### `<SpokenText>`

| Prop               | Type                                                  | Default                | What it does                                                                             |
| ------------------ | ----------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------- |
| `children`         | `string`                                              | —                      | The passage to speak. Required unless you pass `speech`.                                   |
| `speech`           | `SpokenTextController`                                | —                      | A controller from `useSpokenText`, to share one passage with a `Transport`.                |
| `as`               | `"p" \| "div" \| "span" \| …`                          | `"p"`                  | Element the passage renders into.                                                          |
| `className`        | `string`                                              | —                      | Class on that element.                                                                     |
| `classNames`       | `{ word, past, current, future }`                     | —                      | Per-word classes. Setting one drops the built-in look for that slot, so your CSS wins.     |
| `renderWord`       | `(word: DisplayWord) => ReactNode`                    | —                      | Render words yourself. Whitespace is still inserted for you.                               |
| `seekOnWordClick`  | `boolean`                                             | `true`                 | Click a word to play from there.                                                           |
| `endpoint`         | `string`                                              | `"/api/transcription"` | Route that turns text into audio and timings.                                              |
| `fetchAlignment`   | `(text: string) => Promise<Alignment>`                | —                      | Skip `endpoint` and resolve the alignment however you like.                                |
| `onWordChange`     | `(index: number, word?: DisplayWord) => void`          | —                      | Fires when the spoken word changes. `-1` means nothing is spoken yet.                      |
| `debounceMs`       | `number`                                              | `0`                    | Wait this long after `children` stops changing before fetching. Useful behind a textarea.  |
| `autoPlay`         | `boolean`                                             | `false`                | Start speaking as soon as the audio is ready.                                              |

Every word also carries `data-spoken-state="past" | "current" | "future"` and
`data-spoken-index`, so plain CSS can style the highlight without any props.

### `<Transport>`

| Prop         | Type                                                | Default | What it does                                          |
| ------------ | --------------------------------------------------- | ------- | ----------------------------------------------------- |
| `speech`     | `SpokenTextController`                              | —       | Required. The controller to drive.                     |
| `className`  | `string`                                            | —       | Class on the wrapper.                                  |
| `classNames` | `{ root, button, track, elapsed, thumb, time, status }` | —   | Per-part classes, same "your class wins" rule.          |
| `showTime`   | `boolean`                                           | `true`  | Show elapsed / total time.                             |
| `showStatus` | `boolean`                                           | `true`  | Show the loading and error line.                       |

### `useSpokenText(text, options?)`

Takes the same options as `SpokenText` (`endpoint`, `fetchAlignment`,
`onWordChange`, `debounceMs`, `autoPlay`). Pass `null` as the text to switch it
off. It returns:

| Field                                             | What it is                                                  |
| ------------------------------------------------- | ----------------------------------------------------------- |
| `words`                                           | `DisplayWord[]` — text, index, `past \| current \| future`, timings |
| `currentWordIndex`, `currentWord`                 | The word being spoken, or `-1` / `undefined`                 |
| `status`, `isLoading`, `isPlaying`, `error`       | What it is doing right now                                   |
| `currentTime`, `duration`, `audioUrl`             | Playback position and source                                 |
| `play`, `pause`, `toggle`                         | Playback                                                     |
| `seek`, `seekToWord`, `seekToFraction`            | Move the playhead                                            |
| `getAudioElement`                                 | The underlying `Audio`, for anything the API misses          |

## How the audio is made and cached

The bundled route at `src/app/api/transcription/route.ts` does two OpenAI calls:
`tts-1` turns the text into an MP3, then `whisper-1` transcribes that MP3 back
with word-level timestamps. Reading the timings off the generated audio, rather
than guessing them from the text, is what keeps the highlight honest.

Two model calls per passage is slow and not free, so nothing is generated twice.
The input text is hashed with SHA-256, truncated to 16 hex characters, and the
MP3 and the timings JSON are written to Vercel Blob under
`content/<hash>/audio.mp3` and `content/<hash>/transcription.json`. Every
request checks that path first. Identical text anywhere, by anyone, is a cache
hit and comes back in milliseconds. On the client, SWR dedupes and debounces on
top of that, so typing in the textarea does not fire a request per keystroke.

The cache is content-addressed and never invalidated, which is fine because the
key covers the entire input. Change a comma and you get a new hash and a new
recording.

## Known limitations

**Highlighting drifts when the text is not plain prose.** Words are paired with
timestamps by position: the nth whitespace-separated token in your text is
assumed to be the nth word Whisper heard. Whisper does not tokenize on
whitespace, so anything it splits or joins differently throws the count off.
`State-of-the-art tools cost $1,200 per seat, e.g. Figma or Sketch.` is ten
tokens to a whitespace split and fifteen words to Whisper, and from the first
mismatch the highlight runs ahead and then falls off the end of the passage.
Plain prose is fine. Fixing it properly means aligning the two sequences instead
of zipping them, which I have not done yet.

Other things worth knowing: it is English-only (`language: "en"` is pinned in
the Whisper call), the input is capped at 2,000 characters, and long passages
take a while on a cache miss because both model calls run before anything plays.

## Stack

- Next.js 14 (App Router) + Tailwind
- Vercel AI SDK v6 (`@ai-sdk/openai` for speech + transcription)
- Vercel Blob for storing generated MP3s and transcription JSON
- SWR for client-side fetching with debounce + dedupe

## Run it

```bash
npm i
vercel link        # one-time, links to the Vercel project
vercel env pull    # pulls OPENAI_API_KEY and BLOB_READ_WRITE_TOKEN
npm run dev
```

Open http://localhost:3000.

### Required env vars

| Name                    | Source                                               |
| ----------------------- | ---------------------------------------------------- |
| `OPENAI_API_KEY`        | https://platform.openai.com/api-keys                 |
| `BLOB_READ_WRITE_TOKEN` | Auto-set by `vercel env pull` if Blob is provisioned  |

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run typecheck` — strict TypeScript check
- `npm run lint` — ESLint
