/**
 * SpokenText — wrap text, hear it read aloud, watch each word light up.
 *
 * ```tsx
 * import { SpokenText } from "@/spoken-text";
 *
 * <SpokenText>Any text you like.</SpokenText>
 * ```
 */
export { SpokenText } from "./SpokenText";
export type { SpokenTextProps, SpokenTextClassNames } from "./SpokenText";

export { Transport } from "./Transport";
export type { TransportProps, TransportClassNames } from "./Transport";

export { useSpokenText } from "./useSpokenText";

export { createEndpointAligner, DEFAULT_ENDPOINT } from "./fetchAlignment";
export { tokenize } from "./tokenize";

export type {
  Alignment,
  DisplayWord,
  FetchAlignment,
  SpokenTextController,
  SpokenTextOptions,
  SpokenTextStatus,
  SpokenWord,
  WordState,
} from "./types";
