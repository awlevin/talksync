# spoken-text demo

The Next.js app behind [spoken-text.vercel.app](https://spoken-text.vercel.app).
It exists so that breaking the public API of `spoken-text` breaks a build:
everything here imports from `spoken-text`, never from a relative path.

```bash
pnpm install
vercel link        # one-time, links to the Vercel project
vercel env pull apps/demo/.env.local
pnpm dev
```

Open http://localhost:3000. `/example` is the one-line version.

| Env var                 | Where it comes from                                 |
| ----------------------- | --------------------------------------------------- |
| `OPENAI_API_KEY`        | https://platform.openai.com/api-keys                 |
| `BLOB_READ_WRITE_TOKEN` | Set by `vercel env pull` once Blob is provisioned    |
