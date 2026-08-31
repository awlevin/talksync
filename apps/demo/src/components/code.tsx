import type { ReactNode } from "react";

/**
 * Snippets are hand-set rather than run through a highlighter, and they carry
 * only two colours: everything structural is dimmed, and the names that come
 * out of this package are lit rust — the same rust the mark lights one bar in.
 */

/** Keywords, punctuation, comments — the parts that are not the point. */
export const Dim = ({ children }: { children: ReactNode }) => (
  <span className="tok-dim">{children}</span>
);

/** A name exported by `spoken-text`. */
export const Api = ({ children }: { children: ReactNode }) => (
  <span className="tok-api">{children}</span>
);

export const Pane = ({
  file,
  note,
  className,
  children,
}: {
  file: string;
  note?: string;
  className?: string;
  children: ReactNode;
}) => (
  <div className={`flex min-w-0 flex-col ${className ?? ""}`}>
    <div className="flex items-baseline justify-between gap-4 border-b border-rule px-4 py-2.5 sm:px-5">
      <span className="path truncate">{file}</span>
      {note ? <span className="label text-rust">{note}</span> : null}
    </div>
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);

export const Code = ({ children }: { children: ReactNode }) => (
  <pre className="code overflow-x-auto whitespace-pre-wrap px-4 py-4 sm:px-5 sm:py-5">
    <code>{children}</code>
  </pre>
);
