import { isValidElement, type ReactNode } from "react";
import type { MDXComponents } from "mdx/types";
import { Code, type CodeLang } from "@/components/code";
import { DocsArticle } from "@/components/DocsArticle";

/**
 * What MDX renders into.
 *
 * The docs are the same page as the rest of the site, so nothing here invents
 * a look: the display face for headings, the reading face for prose, the
 * accent for links and names, and the in-house scanner for snippets.
 */

/** Flatten a heading's children to text, so it can be turned into an anchor. */
const textOf = (node: ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textOf(node.props.children);
  }
  return "";
};

const slug = (node: ReactNode): string =>
  textOf(node)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * A heading that can be linked to. The id comes from the words, so an anchor
 * survives everything except a rewrite of the heading itself. `scroll-mt`
 * clears the player, which is sticky at the top of the column.
 */
const Heading = ({
  as: Tag,
  className,
  children,
}: {
  as: "h2" | "h3";
  className: string;
  children?: ReactNode;
}) => (
  <Tag id={slug(children)} className={`display scroll-mt-24 ${className}`}>
    {children}
  </Tag>
);

/** The language a fence asked for, if the scanner knows it. */
const LANGS = new Set<string>([
  "tsx",
  "ts",
  "bash",
  "sh",
  "css",
  "json",
  "text",
]);

const langOf = (className: unknown): CodeLang => {
  const name =
    typeof className === "string"
      ? (className.match(/language-([\w-]+)/)?.[1] ?? "")
      : "";
  return LANGS.has(name) ? (name as CodeLang) : "tsx";
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // The MDX page is handed to `<SpokenText>` here, where its children are
    // still real elements rather than a component the walk cannot see into.
    wrapper: ({ children }) => <DocsArticle>{children}</DocsArticle>,

    h1: ({ children }) => (
      <h1 className="display mb-4 text-[2rem] font-bold leading-tight text-ink sm:text-[2.4rem]">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <Heading as="h2" className="mb-3 mt-12 text-[1.35rem] font-semibold text-ink">
        {children}
      </Heading>
    ),
    h3: ({ children }) => (
      <Heading as="h3" className="mb-2 mt-8 text-[1.05rem] font-semibold text-ink">
        {children}
      </Heading>
    ),

    p: ({ children }) => <p className="mb-5">{children}</p>,

    ul: ({ children }) => (
      <ul className="mb-5 list-disc space-y-1.5 pl-5 marker:text-ink-2/50">
        {children}
      </ul>
    ),
    a: ({ href, children }) => (
      <a
        className="text-accent underline decoration-dotted underline-offset-4"
        href={href}
        {...(href?.startsWith("http")
          ? { target: "_blank", rel: "noreferrer" }
          : null)}
      >
        {children}
      </a>
    ),

    strong: ({ children }) => (
      <strong className="font-semibold text-ink">{children}</strong>
    ),

    // Inline code. It is a real `code`, so the default skip list leaves it
    // unspoken without anything having to say so.
    code: ({ children }) => (
      <code className="font-mono text-[0.85em] text-accent">{children}</code>
    ),

    /**
     * A fence. MDX nests the source in a `code` child, so the language and the
     * text are read back off it and handed to the scanner.
     *
     * The panel carries `data-spoken-skip` because what the walk sees here is
     * this component, not a `pre` — the default skip list matches tags, and by
     * the time it looks the tag is gone.
     */
    pre: ({ children }) => {
      const source = isValidElement<{ children?: ReactNode; className?: string }>(
        children,
      )
        ? children.props
        : { children: "", className: "" };
      return (
        <div className="panel mb-6 overflow-hidden" data-spoken-skip>
          <Code lang={langOf(source.className)} wrap={false}>
            {typeof source.children === "string"
              ? source.children.replace(/\n$/, "")
              : ""}
          </Code>
        </div>
      );
    },

    ...components,
  };
}
