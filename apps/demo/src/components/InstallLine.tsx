"use client";

import { useEffect, useState } from "react";

const COMMAND = "npm i spoken-text";

/** The install line, and a button that puts it on the clipboard. */
export const InstallLine = () => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(COMMAND).then(
          () => setCopied(true),
          () => setCopied(false),
        );
      }}
      className="panel group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:border-accent/40"
    >
      <span aria-hidden className="font-mono text-sm text-ink-2">
        $
      </span>
      <span className="font-mono text-sm font-medium text-ink sm:text-[0.9375rem]">
        {COMMAND}
      </span>
      <span className="label ml-auto shrink-0 group-hover:text-accent">
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
};
