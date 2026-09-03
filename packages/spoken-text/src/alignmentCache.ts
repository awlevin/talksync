import type { Alignment, BlockKind } from "./types.js";

/**
 * A tiny module-level cache for resolved alignments, keyed by endpoint, text
 * and kind.
 *
 * Turning a passage into audio costs two model calls, so the same passage must
 * never be requested twice: two `<SpokenText>` components sharing a passage
 * share one request, and remounting one resolves from memory instead of going
 * back to the network. That is the whole of what SWR was doing here, so the
 * dependency is not worth carrying.
 */

/** Enough to hold a page's worth of passages without growing without bound. */
const MAX_ENTRIES = 50;

const inFlight = new Map<string, Promise<Alignment>>();
const resolved = new Map<string, Alignment>();

const remember = (key: string, value: Alignment): void => {
  resolved.set(key, value);
  while (resolved.size > MAX_ENTRIES) {
    const oldest = resolved.keys().next();
    if (oldest.done) break;
    resolved.delete(oldest.value);
  }
};

/**
 * The key a passage is cached under. `kind` is part of it because a heading
 * and a paragraph of the same words are read differently, so they are two
 * recordings.
 */
export const alignmentKey = (
  endpoint: string,
  text: string,
  kind: BlockKind,
): string => JSON.stringify([endpoint, text, kind]);

/** An alignment already in memory, if there is one. */
export const peekAlignment = (key: string): Alignment | undefined =>
  resolved.get(key);

/**
 * Resolve `key`, reusing an in-flight request for the same key and caching the
 * result. A failed request is not cached, so the next mount tries again.
 */
export const loadAlignment = (
  key: string,
  load: () => Promise<Alignment>,
): Promise<Alignment> => {
  const cached = resolved.get(key);
  if (cached) return Promise.resolve(cached);

  const pending = inFlight.get(key);
  if (pending) return pending;

  const promise = load().then(
    (value) => {
      inFlight.delete(key);
      remember(key, value);
      return value;
    },
    (error: unknown) => {
      inFlight.delete(key);
      throw error;
    },
  );

  inFlight.set(key, promise);
  return promise;
};

/** Drop everything. Exported for tests and for long-lived single-page apps. */
export const clearAlignmentCache = (): void => {
  resolved.clear();
  inFlight.clear();
};
