"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SpokenDocument } from "./document.js";
import { useSpokenDocument } from "./useSpokenDocument.js";
import type { SpokenTextController, SpokenTextOptions } from "./types.js";

export type SpokenTextContextValue = {
  controller: SpokenTextController;
  /** A `<SpokenText>` hands the provider the document it walked. */
  register: (document: SpokenDocument | null) => void;
};

export const SpokenTextContext = createContext<SpokenTextContextValue | null>(
  null,
);

export type SpokenTextProviderProps = SpokenTextOptions & {
  children: ReactNode;
};

/**
 * Holds one controller for a document, so the player does not have to be a
 * sibling of the text. Put it around the page, put `<Player>` in a sticky
 * header, and put `<SpokenText>` wherever the article lives.
 *
 * ```tsx
 * <SpokenTextProvider>
 *   <StickyHeader><Player /></StickyHeader>
 *   <article><SpokenText>{…}</SpokenText></article>
 * </SpokenTextProvider>
 * ```
 *
 * One document per provider: the `<SpokenText>` inside it registers what it
 * says, and the provider reads it.
 */
export const SpokenTextProvider = ({
  children,
  ...options
}: SpokenTextProviderProps) => {
  const [document, setDocument] = useState<SpokenDocument | null>(null);
  const controller = useSpokenDocument(document, options);

  const value = useMemo<SpokenTextContextValue>(
    () => ({ controller, register: setDocument }),
    [controller],
  );

  return (
    <SpokenTextContext.Provider value={value}>
      {children}
    </SpokenTextContext.Provider>
  );
};

/**
 * The controller the nearest `<SpokenTextProvider>` is holding, for building a
 * player of your own.
 */
export const useSpokenTextController = (): SpokenTextController => {
  const context = useContext(SpokenTextContext);
  if (!context) {
    throw new Error(
      "useSpokenTextController must be used inside a <SpokenTextProvider>.",
    );
  }
  return context.controller;
};
