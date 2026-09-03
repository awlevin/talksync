/**
 * spoken-text — wrap text, hear it read aloud, watch each word light up.
 *
 * ```tsx
 * import { SpokenText } from "spoken-text";
 *
 * <SpokenText>Any text you like.</SpokenText>
 * ```
 *
 * The server half — the route that turns text into audio and word timings —
 * lives in `spoken-text/server`.
 */
export { SpokenText } from "./SpokenText.js";
export type { SpokenTextProps, SpokenTextClassNames } from "./SpokenText.js";

export { Player } from "./Player.js";
export type { PlayerProps, PlayerClassNames } from "./Player.js";

export {
  SpokenTextProvider,
  useSpokenTextController,
} from "./SpokenTextProvider.js";
export type { SpokenTextProviderProps } from "./SpokenTextProvider.js";

export { useSpokenText } from "./useSpokenText.js";

export { DEFAULT_SKIP } from "./document.js";
export type { SpokenSelector } from "./document.js";

export { createEndpointAligner, DEFAULT_ENDPOINT } from "./fetchAlignment.js";
export { clearAlignmentCache } from "./alignmentCache.js";
export { tokenize } from "./tokenize.js";
export type { Tokens } from "./tokenize.js";
export { alignTokens, normalizeForAlignment, tokenIndexAt } from "./align.js";
export type { SpokenSpan } from "./align.js";

export type {
  Alignment,
  DisplayWord,
  FetchAlignment,
  SegmentStatus,
  SpokenSegment,
  SpokenTextController,
  SpokenTextOptions,
  SpokenTextStatus,
  SpokenWord,
  WordState,
} from "./types.js";
