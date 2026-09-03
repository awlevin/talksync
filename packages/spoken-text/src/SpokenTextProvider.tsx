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

/**
 * What a `<SpokenText>` hands up: the document it walked, and the options it
 * was given itself. The options are read through a function rather than copied
 * into state, so an inline `fetchAlignment` does not have to be stable to be
 * honoured.
 */
export type SpokenTextRegistration = {
  document: SpokenDocument;
  options: () => SpokenTextOptions;
};

export type SpokenTextContextValue = {
  controller: SpokenTextController;
  /** A `<SpokenText>` registers what it says, and how it wants it fetched. */
  register: (registration: SpokenTextRegistration | null) => void;
};

export const SpokenTextContext = createContext<SpokenTextContextValue | null>(
  null,
);

export type SpokenTextProviderProps = SpokenTextOptions & {
  children: ReactNode;
};

/** Only the options actually given, so an absent one cannot clobber a default. */
const given = (options: SpokenTextOptions): SpokenTextOptions =>
  Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined),
  ) as SpokenTextOptions;

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
  const [registered, setRegistered] = useState<SpokenTextRegistration | null>(
    null,
  );

  // The provider's options are the document's defaults. Anything set on the
  // `<SpokenText>` itself wins, because that is where the document is: a
  // `debounceMs` written next to the text is about that text.
  const controller = useSpokenDocument(registered?.document ?? null, {
    ...options,
    ...given(registered?.options() ?? {}),
  });

  const value = useMemo<SpokenTextContextValue>(
    () => ({ controller, register: setRegistered }),
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
