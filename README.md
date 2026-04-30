# TalkSync

Type some text, hit play, watch the words light up as they're spoken.

The text is run through OpenAI's `tts-1-hd` for speech and `whisper-1` for
word-level timestamps. Both results are cached in Vercel Blob keyed on a hash
of the input, so the same text never gets generated twice.

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

| Name                    | Source                                 |
| ----------------------- | -------------------------------------- |
| `OPENAI_API_KEY`        | https://platform.openai.com/api-keys   |
| `BLOB_READ_WRITE_TOKEN` | Auto-set by `vercel env pull` if Blob is provisioned |

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run typecheck` — strict TypeScript check
- `npm run lint` — ESLint
