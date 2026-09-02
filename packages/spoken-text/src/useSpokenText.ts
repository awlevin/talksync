"use client";

import { useMemo } from "react";
import { documentFromText } from "./document.js";
import { useSpokenDocument } from "./useSpokenDocument.js";
import type { SpokenTextController, SpokenTextOptions } from "./types.js";

/**
 * Headless speech + highlighting for one passage. Pass `null` to switch it off.
 *
 * ```tsx
 * const speech = useSpokenText("Any text you like.");
 * <button onClick={speech.toggle}>{speech.isPlaying ? "Pause" : "Play"}</button>
 * ```
 *
 * A string is a one-block document, so the controller it returns is the same
 * one `<SpokenText>` builds for a whole article — with one entry in `segments`.
 */
export const useSpokenText = (
  text: string | null | undefined,
  options: SpokenTextOptions = {},
): SpokenTextController => {
  const document = useMemo(() => documentFromText(text ?? ""), [text]);
  return useSpokenDocument(document, options);
};
