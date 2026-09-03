import type { ReactNode } from "react";

/**
 * A reference table, set as a definition list rather than a `table` so it
 * folds down to one column on a phone instead of scrolling sideways.
 *
 * The docs pages mark these `data-spoken-skip`. A list of type signatures read
 * aloud is noise, and the attribute is the same one the documents page tells
 * you to reach for, so the docs are using their own advice.
 */
export const Props = ({
  children,
  ...rest
}: {
  children: ReactNode;
} & Record<string, unknown>) => (
  <dl className="mb-6 border-b border-rule" {...rest}>
    {children}
  </dl>
);

export const Prop = ({
  name,
  type,
  children,
}: {
  name: string;
  /** The signature, when there is one worth reading. */
  type?: string;
  children: ReactNode;
}) => (
  <div className="grid grid-cols-1 gap-x-6 gap-y-1 border-t border-rule py-3 sm:grid-cols-[minmax(0,12rem)_1fr]">
    <div className="min-w-0">
      <dt className="font-mono text-[0.8125rem] font-medium text-accent">
        {name}
      </dt>
      {type ? (
        <div className="font-mono text-[0.6875rem] leading-relaxed text-ink-2">
          {type}
        </div>
      ) : null}
    </div>
    {/* MDX wraps a multi-line child in a paragraph; inside a row it is the row
        that owns the spacing. */}
    <dd className="text-[0.9375rem] leading-relaxed text-ink-2 [&_p]:mb-0">
      {children}
    </dd>
  </div>
);
