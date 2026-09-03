import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { tokenize } from "./tokenize.js";
import type { BlockKind } from "./types.js";

/**
 * Turning a tree of elements into something that can be read aloud.
 *
 * React children are opaque until they are rendered, so this walks the literal
 * elements it is given: `<h2>`, `<p>`, `<a>`. Text inside a child *component*
 * is invisible to it. That is the one boundary, and the recommendation is to
 * hand `<SpokenText>` the elements themselves — which is what MDX produces.
 */

/**
 * How `skip` and `only` name part of the tree: a tag (`"pre"`), a class
 * (`".footnote"`), an attribute (`"[aria-hidden]"`), or a predicate over the
 * React element itself.
 */
export type SpokenSelector = string | ((element: ReactElement) => boolean);

/** Elements that are almost never worth reading aloud. */
export const DEFAULT_SKIP: readonly SpokenSelector[] = [
  "code",
  "pre",
  "kbd",
  "samp",
  "var",
  "script",
  "style",
  "svg",
  "canvas",
  "iframe",
  "math",
];

/**
 * Block-level tags. Each one is a boundary: text on either side of it belongs
 * to a different alignment request, so a paragraph caches on its own and
 * playback can start at any of them.
 */
const BLOCK = new Set([
  "address", "article", "aside", "blockquote", "dd", "details", "dialog",
  "div", "dl", "dt", "fieldset", "figcaption", "figure", "footer", "form",
  "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "hr", "li", "main",
  "nav", "ol", "p", "pre", "section", "table", "tbody", "td", "tfoot", "th",
  "thead", "tr", "ul",
]);

/**
 * Tags that say what a block *is*. Every other block — `p`, `div`, `section` —
 * keeps the kind it sits inside, because markdown wraps list items and quotes
 * in a paragraph (`<blockquote><p>…</p></blockquote>`) and that paragraph must
 * not talk over the quote.
 */
const KIND_OF: Record<string, BlockKind> = {
  h1: "heading",
  h2: "heading",
  h3: "heading",
  h4: "heading",
  h5: "heading",
  h6: "heading",
  li: "list",
  blockquote: "quote",
};

/** One block, as a range over the document's words plus the text to align. */
export type DocumentSegment = {
  start: number;
  end: number;
  /** The text handed to the aligner, with skipped spans already excised. */
  text: string;
  /** What the block is, so the voice can read it accordingly. */
  kind: BlockKind;
};

/** A document, segmented into the blocks it is read in. */
export type SpokenDocument = {
  /** The whole document as one string, for `controller.text`. */
  text: string;
  /** Every spoken word, in order, across every block. */
  words: string[];
  segments: DocumentSegment[];
};

export const EMPTY_DOCUMENT: SpokenDocument = {
  text: "",
  words: [],
  segments: [],
};

/** Render one spoken word. `index` is its position in the whole document. */
export type RenderSpokenWord = (word: string, index: number) => ReactNode;

export type SpokenRules = {
  skip?: readonly SpokenSelector[];
  /** Unset means the whole tree is in the field. */
  only?: readonly SpokenSelector[];
};

const props = (element: ReactElement): Record<string, unknown> =>
  element.props as Record<string, unknown>;

const matches = (element: ReactElement, selector: SpokenSelector): boolean => {
  if (typeof selector === "function") return selector(element);

  if (selector.startsWith(".")) {
    const className = props(element).className;
    return (
      typeof className === "string" &&
      className.split(/\s+/).includes(selector.slice(1))
    );
  }

  if (selector.startsWith("[") && selector.endsWith("]")) {
    const value = props(element)[selector.slice(1, -1)];
    return value !== undefined && value !== null && value !== false;
  }

  return (
    typeof element.type === "string" &&
    element.type.toLowerCase() === selector.toLowerCase()
  );
};

const matchesAny = (
  element: ReactElement,
  selectors: readonly SpokenSelector[] | undefined,
): boolean => !!selectors?.some((selector) => matches(element, selector));

/** `data-spoken` and `data-spoken-skip`: set unless written as `false`. */
const flagged = (element: ReactElement, name: string): boolean => {
  const value = props(element)[name];
  return (
    value !== undefined && value !== null && value !== false && value !== "false"
  );
};

/** The words of one text leaf, each wrapped, with its whitespace put back. */
export const renderLeaf = (
  text: string,
  firstIndex: number,
  renderWord: RenderSpokenWord,
): ReactNode => {
  const { lead, words, separators } = tokenize(text);
  return (
    <>
      {lead}
      {words.map((word, i) => (
        <span key={firstIndex + i}>
          {renderWord(word, firstIndex + i)}
          {separators[i]}
        </span>
      ))}
    </>
  );
};

type Field = { spoken: boolean; blocked: boolean };

export type WalkedDocument = SpokenDocument & {
  /** The children again, with every spoken text leaf replaced by word spans. */
  node: ReactNode;
};

/**
 * Walk `children`, collecting the text to speak and rebuilding the tree with
 * each spoken word wrapped. Structure is preserved exactly: an `h2` stays an
 * `h2`, a link stays a link, and skipped content is left rendered where it is
 * and dropped only from the text handed to the aligner.
 *
 * Pass `renderWord` as `null` to collect without rebuilding.
 */
export const walkDocument = (
  children: ReactNode,
  rules: SpokenRules,
  renderWord: RenderSpokenWord | null,
): WalkedDocument => {
  const words: string[] = [];
  const segments: DocumentSegment[] = [];
  let buffer = "";
  let start = 0;
  // Text outside any block is prose, so a bare string reads as a paragraph.
  let kind: BlockKind = "paragraph";

  const flush = () => {
    const text = buffer.trim();
    if (text && words.length > start) {
      segments.push({ start, end: words.length, text, kind });
    }
    buffer = "";
    start = words.length;
  };

  const leaf = (text: string, spoken: boolean): ReactNode => {
    if (!spoken || !text) return text;
    buffer += text;
    const tokens = tokenize(text).words;
    if (tokens.length === 0) return text;

    const first = words.length;
    words.push(...tokens);
    return renderWord ? renderLeaf(text, first, renderWord) : text;
  };

  const walk = (node: ReactNode, field: Field): ReactNode => {
    if (typeof node === "string") return leaf(node, field.spoken);
    if (typeof node === "number") return leaf(String(node), field.spoken);
    if (node == null || typeof node === "boolean") return node;
    if (Array.isArray(node)) {
      return Children.map(node, (child) => walk(child, field));
    }
    if (!isValidElement(node)) return node;

    const element = node as ReactElement<{ children?: ReactNode }>;
    const blocked =
      field.blocked ||
      flagged(element, "data-spoken-skip") ||
      matchesAny(element, rules.skip);
    const spoken = blocked
      ? false
      : field.spoken ||
        (!!rules.only &&
          (matchesAny(element, rules.only) || flagged(element, "data-spoken")));

    const tag = typeof element.type === "string" ? element.type.toLowerCase() : "";
    const isBlock = BLOCK.has(tag);
    if (isBlock) flush();

    const outer = kind;
    kind = KIND_OF[tag] ?? kind;

    const kids = element.props.children;
    const walked =
      kids == null
        ? element
        : cloneElement(element, undefined, walk(kids, { spoken, blocked }));

    if (isBlock) flush();
    kind = outer;
    return walked;
  };

  const node = walk(children, { spoken: !rules.only, blocked: false });
  flush();

  return {
    text: segments.map((segment) => segment.text).join("\n\n"),
    words,
    segments,
    node,
  };
};

/** Collect what a tree says, without rebuilding it. */
export const collectDocument = (
  children: ReactNode,
  rules: SpokenRules,
): SpokenDocument => walkDocument(children, rules, null);

/** A plain string is a one-block document. */
export const documentFromText = (text: string): SpokenDocument => {
  const words = tokenize(text).words;
  const trimmed = text.trim();
  return {
    text,
    words,
    segments: trimmed
      ? [{ start: 0, end: words.length, text: trimmed, kind: "paragraph" }]
      : [],
  };
};

/**
 * What a document says, as one string. Two documents with the same signature
 * are asked for the same audio, so it is what identity is kept on.
 */
export const documentSignature = (document: SpokenDocument): string =>
  JSON.stringify([
    document.text,
    document.words,
    document.segments.map((s) => [s.start, s.end, s.text, s.kind]),
  ]);
