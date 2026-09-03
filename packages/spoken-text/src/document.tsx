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
  /** `1` for a word that is said but not on the page — see `say`. */
  hidden: Uint8Array;
  segments: DocumentSegment[];
};

export const EMPTY_DOCUMENT: SpokenDocument = {
  text: "",
  words: [],
  hidden: new Uint8Array(0),
  segments: [],
};

/** Render one spoken word. `index` is its position in the whole document. */
export type RenderSpokenWord = (word: string, index: number) => ReactNode;

/**
 * Render the whitespace that follows the word at `index`. It carries the
 * highlight between two lit words, so the band is one stripe rather than a row
 * of tiles.
 */
export type RenderSeparator = (separator: string, index: number) => ReactNode;

/** What a `say` rule is told about the element it matched. */
export type SayInfo = {
  /** The element's own spoken text, after `skip` and `only`; `""` if skipped. */
  text: string;
  element: ReactElement;
  /** 1-based count of the elements this same rule has matched so far. */
  count: number;
  kind: BlockKind;
};

/**
 * A string replaces what the element says; `before` and `after` keep its own
 * words and speak around them. Nothing means no change.
 */
export type SayResult =
  | string
  | { before?: string; after?: string }
  | null
  | undefined;

export type SayRule = (info: SayInfo) => SayResult;

export type SpokenRules = {
  skip?: readonly SpokenSelector[];
  /** Unset means the whole tree is in the field. */
  only?: readonly SpokenSelector[];
  /** Words to speak that are not on the page. Keys select like `skip` does. */
  say?: Record<string, SayRule>;
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
  renderSeparator?: RenderSeparator,
): ReactNode => {
  const { lead, words, separators } = tokenize(text);
  return (
    <>
      {lead}
      {words.map((word, i) => (
        <span key={firstIndex + i}>
          {renderWord(word, firstIndex + i)}
          {renderSeparator
            ? renderSeparator(separators[i], firstIndex + i)
            : separators[i]}
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
  renderSeparator?: RenderSeparator,
): WalkedDocument => {
  let words: string[] = [];
  let hiddenAt = new Set<number>();
  let segments: DocumentSegment[] = [];
  let buffer = "";
  let start = 0;
  // Text outside any block is prose, so a bare string reads as a paragraph.
  let kind: BlockKind = "paragraph";
  // Set while measuring what one element says on its own: nothing is rendered
  // and no rule fires, so a measurement cannot change the document.
  let dry = false;
  const counts = new Map<string, number>();

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
    return renderWord && !dry
      ? renderLeaf(text, first, renderWord, renderSeparator)
      : text;
  };

  /**
   * Words that are said and never shown. They go into the stream where the
   * element sits, so the aligner is asked for exactly what is spoken and the
   * words around them stay correctly timed.
   */
  const inject = (text: string) => {
    const tokens = tokenize(text).words;
    if (tokens.length === 0) return;
    if (buffer && !/\s$/.test(buffer)) buffer += " ";
    buffer += `${tokens.join(" ")} `;
    for (const token of tokens) {
      hiddenAt.add(words.length);
      words.push(token);
    }
  };

  /** A `say` result, with a bare string read as the replacement it is. */
  type Said = { before?: string; after?: string; replace?: string };

  /**
   * What an element says on its own, for a rule to read. Walked into a scratch
   * state, so what is measured is thrown away rather than said twice.
   */
  const textOf = (element: ReactElement, field: Field): string => {
    const held = { words, hiddenAt, segments, buffer, start, kind, dry };
    words = [];
    hiddenAt = new Set();
    segments = [];
    buffer = "";
    start = 0;
    dry = true;

    walk(element, field);
    flush();
    const text = segments.map((segment) => segment.text).join(" ");

    ({ words, hiddenAt, segments, buffer, start, kind, dry } = held);
    return text;
  };

  /** The rule for an element, if one matches. First key wins. */
  const sayFor = (
    element: ReactElement,
    field: Field,
    kindOf: BlockKind,
  ): Said | undefined => {
    if (!rules.say) return undefined;

    for (const [selector, rule] of Object.entries(rules.say)) {
      if (!matches(element, selector)) continue;
      // Counted per key, so a rule can number the headings it announces.
      const count = (counts.get(selector) ?? 0) + 1;
      counts.set(selector, count);

      const said = rule({
        text: textOf(element, field),
        element,
        count,
        kind: kindOf,
      });
      if (!said) return undefined;
      return typeof said === "string" ? { replace: said } : said;
    }
    return undefined;
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
    /**
     * Whether the element is in the field at all, skipping aside. A `say` rule
     * reads this rather than `spoken`, so a skipped element can still be
     * announced while one outside an `only` fence stays silent.
     */
    const inField =
      field.spoken ||
      (!!rules.only &&
        (matchesAny(element, rules.only) || flagged(element, "data-spoken")));
    const spoken = blocked ? false : inField;

    const tag = typeof element.type === "string" ? element.type.toLowerCase() : "";
    const isBlock = BLOCK.has(tag);
    const said =
      !dry && inField ? sayFor(element, field, KIND_OF[tag] ?? kind) : undefined;

    if (isBlock) flush();

    const outer = kind;
    kind = KIND_OF[tag] ?? kind;

    // Said ahead of the element's own words, and — for a skipped block — in
    // place of them, as a segment of its own.
    if (said?.before) inject(said.before);
    if (said?.replace) inject(said.replace);

    // A replacement stands in for everything the element says, so its own
    // words go unspoken and, like anything skipped, render as they were.
    const silenced = blocked || !!said?.replace;
    const kids = element.props.children;
    const walked =
      kids == null
        ? element
        : cloneElement(
            element,
            undefined,
            walk(kids, { spoken: silenced ? false : spoken, blocked: silenced }),
          );

    if (said?.after) inject(said.after);

    if (isBlock) flush();
    kind = outer;
    return walked;
  };

  const node = walk(children, { spoken: !rules.only, blocked: false });
  flush();

  const hidden = new Uint8Array(words.length);
  for (const index of hiddenAt) hidden[index] = 1;

  return {
    text: segments.map((segment) => segment.text).join("\n\n"),
    words,
    hidden,
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
    hidden: new Uint8Array(words.length),
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
    // What is said but not shown moves the signature too: change a `say` rule
    // and the document is a different reading.
    Array.from(document.hidden),
    document.segments.map((s) => [s.start, s.end, s.text, s.kind]),
  ]);
