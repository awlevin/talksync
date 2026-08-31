import type { AlignmentCache, CachedAlignment } from "../types.js";

/**
 * Keep generated audio in Vercel Blob.
 *
 * `@vercel/blob` is an optional peer dependency, imported only when the cache
 * is actually used. Needs `BLOB_READ_WRITE_TOKEN` in the environment, or a
 * `token` passed here.
 */

export type VercelBlobCacheOptions = {
  /** Folder the entries live under. Default `"spoken-text"`. */
  prefix?: string;
  /** Overrides `BLOB_READ_WRITE_TOKEN`. */
  token?: string;
};

/** What is written alongside the audio. */
type StoredAlignment = CachedAlignment;

export const vercelBlobCache = ({
  prefix = "spoken-text",
  token,
}: VercelBlobCacheOptions = {}): AlignmentCache => {
  // No extension: the blob is served with the content type it was stored
  // under, which is what a browser goes by.
  const audioPath = (hash: string) => `${prefix}/${hash}/audio`;
  const alignmentPath = (hash: string) => `${prefix}/${hash}/alignment.json`;

  return {
    async get(hash) {
      const { head } = await import("@vercel/blob");
      try {
        const info = await head(alignmentPath(hash), { token });
        const res = await fetch(info.url);
        if (!res.ok) return null;
        const stored = (await res.json()) as StoredAlignment;
        return stored.audioUrl && Array.isArray(stored.words) ? stored : null;
      } catch {
        // `head` throws when the entry is not there, which is a cache miss.
        return null;
      }
    },

    async set(hash, audio, words, duration) {
      const { put } = await import("@vercel/blob");

      const stored = await put(
        audioPath(hash),
        // A `Uint8Array` is a `BlobPart` at runtime. TypeScript 5.7 narrowed
        // the DOM type to buffers it can prove are not shared, which this is.
        new Blob([audio.audio as BlobPart], { type: audio.contentType }),
        {
          access: "public",
          contentType: audio.contentType,
          addRandomSuffix: false,
          allowOverwrite: true,
          token,
        },
      );

      const alignment: StoredAlignment = {
        audioUrl: stored.url,
        words,
        ...(duration === undefined ? {} : { duration }),
      };

      await put(alignmentPath(hash), JSON.stringify(alignment), {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
        token,
      });

      return alignment;
    },
  };
};
