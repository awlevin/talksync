import { Children, Fragment, type ReactNode } from "react";

/**
 * Snippets are coloured here rather than by a library. The page's whole claim
 * is that the package is dependency-light, and a demo that pulled in a
 * highlighter to say so would be saying something else.
 *
 * The scanner below knows just enough JSX and TypeScript for the snippets this
 * page shows: tags, attributes, strings, expressions, comments and the handful
 * of keywords that appear. Anything it does not recognise stays the colour of
 * the prose, which is the right answer for text.
 *
 * The docs pages fence their snippets, so a fence's language picks the scanner:
 * shell and JSON are small enough to read on their own terms, and everything
 * else is TypeScript.
 */

/** What a fence can ask for. Anything else is read as TypeScript. */
export type CodeLang = "tsx" | "ts" | "bash" | "sh" | "css" | "json" | "text";

type Kind = "plain" | "dim" | "api" | "tag" | "attr" | "str";

type Token = { kind: Kind; text: string };

const CLASS: Partial<Record<Kind, string>> = {
  dim: "tok-dim",
  api: "tok-api",
  tag: "tok-tag",
  attr: "tok-attr",
  str: "tok-str",
};

/** Grammar, not names. */
const KEYWORDS = new Set([
  "as",
  "async",
  "await",
  "const",
  "default",
  "export",
  "from",
  "function",
  "import",
  "let",
  "new",
  "return",
  "type",
]);

/** Names this package exports. They are what every snippet is about. */
const API = new Set([
  "alignTokens",
  "clearAlignmentCache",
  "createAlignmentHandler",
  "createEndpointAligner",
  "DEFAULT_ENDPOINT",
  "DEFAULT_SKIP",
  "elevenlabsSpeech",
  "normalizeForAlignment",
  "openaiSpeech",
  "openaiTranscription",
  "Player",
  "sha256Hex",
  "SpokenText",
  "SpokenTextProvider",
  "tokenIndexAt",
  "tokenize",
  "useSpokenText",
  "useSpokenTextController",
  "vercelBlobCache",
]);

/* Anchored patterns: each one either matches where the scanner is, or not. */
const SPACE = /^\s+/;
const LINE_COMMENT = /^\/\/[^\n]*/;
const BLOCK_COMMENT = /^\/\*[\s\S]*?\*\//;
const STRING = /^(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/;
const NAME = /^[A-Za-z_$][\w$]*/;
/** Attributes and tags take the dashes that `data-spoken-skip` and `h2` need. */
const TAG_NAME = /^[A-Za-z][\w.-]*/;
const ATTR_NAME = /^[A-Za-z_][\w-]*/;
const NUMBER = /^\d[\w.]*/;
/** JSX text: everything up to the next tag or expression. */
const TEXT = /^[^<{]+/;

/** A snippet is a few hundred characters, so the tail is cheap to cut. */
const at = (pattern: RegExp, source: string, from: number): string | null =>
  pattern.exec(source.slice(from))?.[0] ?? null;

/** A `<` opens a tag unless it is following a value, where it is less-than. */
const opensTag = (source: string, i: number, previous: string): boolean =>
  /[A-Za-z/>]/.test(source[i + 1] ?? "") && !/[\w$)\]]/.test(previous);

type Mode = "js" | "tag" | "text";

/**
 * One scan over a snippet, keeping its state between calls: the live example
 * hands its snippet over in pieces, with an editable span in the middle.
 */
const createTypeScriptScanner = () => {
  let mode: Mode = "js";
  /** Where the tag being read returns to, and where each open element does. */
  let pending: Mode = "js";
  const open: Mode[] = [];
  /** A `{…}` in a tag or in JSX text: where it came from, and the braces
   *  counted inside it, so the closing one is recognised. */
  const expressions: { back: Mode; depth: number; pending: Mode }[] = [];
  let depth = 0;
  let closing = false;
  let named = false;

  return (source: string): Token[] => {
    const out: Token[] = [];
    const push = (kind: Kind, text: string) => {
      const last = out[out.length - 1];
      if (last?.kind === kind) last.text += text;
      else out.push({ kind, text });
    };

    let i = 0;
    let previous = "";
    const take = (kind: Kind, text: string) => {
      push(kind, text);
      i += text.length;
      const trimmed = text.trimEnd();
      if (trimmed) previous = trimmed[trimmed.length - 1];
    };

    const openTag = () => {
      closing = source[i + 1] === "/";
      if (!closing) pending = mode;
      take("dim", closing ? "</" : "<");
      mode = "tag";
      named = false;
    };

    const openExpression = () => {
      expressions.push({ back: mode, depth, pending });
      depth = 0;
      mode = "js";
      take("attr", "{");
    };

    while (i < source.length) {
      const char = source[i];

      if (mode === "text") {
        const text = at(TEXT, source, i);
        if (text) take("plain", text);
        else if (char === "<") openTag();
        else openExpression();
        continue;
      }

      if (mode === "tag") {
        const space = at(SPACE, source, i);
        if (space) {
          take("plain", space);
          continue;
        }
        if (!named) {
          const name = at(TAG_NAME, source, i) ?? char;
          take(/^[A-Z]/.test(name) ? "api" : "tag", name);
          named = true;
          continue;
        }
        if (source.startsWith("/>", i)) {
          take("dim", "/>");
          mode = pending;
          continue;
        }
        if (char === ">") {
          take("dim", ">");
          if (closing) mode = open.pop() ?? "js";
          else {
            open.push(pending);
            mode = "text";
          }
          continue;
        }
        const text = at(STRING, source, i);
        if (text) {
          take("str", text);
          continue;
        }
        if (char === "{") {
          openExpression();
          continue;
        }
        const name = at(ATTR_NAME, source, i);
        take(name ? "attr" : "dim", name ?? char);
        continue;
      }

      // Plain TypeScript, and the inside of every `{…}`.
      const space = at(SPACE, source, i);
      if (space) {
        push("plain", space);
        i += space.length;
        continue;
      }
      const comment = at(LINE_COMMENT, source, i) ?? at(BLOCK_COMMENT, source, i);
      if (comment) {
        take("dim", comment);
        continue;
      }
      const text = at(STRING, source, i);
      if (text) {
        take("str", text);
        continue;
      }
      const name = at(NAME, source, i);
      if (name) {
        take(KEYWORDS.has(name) ? "dim" : API.has(name) ? "api" : "plain", name);
        continue;
      }
      const number = at(NUMBER, source, i);
      if (number) {
        take("plain", number);
        continue;
      }
      if (char === "<" && opensTag(source, i, previous)) {
        openTag();
        continue;
      }
      if (char === "{") {
        depth += 1;
        take("dim", char);
        continue;
      }
      if (char === "}") {
        const expression = expressions[expressions.length - 1];
        if (depth === 0 && expression) {
          expressions.pop();
          take("attr", char);
          mode = expression.back;
          depth = expression.depth;
          pending = expression.pending;
        } else {
          depth = Math.max(0, depth - 1);
          take("dim", char);
        }
        continue;
      }
      take("dim", char);
    }

    return out;
  };
};

/* A shell line: the prompt, the command, its flags, and its quoted arguments. */
const SHELL_COMMENT = /^#[^\n]*/;
const SHELL_FLAG = /^--?[A-Za-z][\w-]*/;
const SHELL_WORD = /^[^\s"'#]+/;

/**
 * Shell. The command is the name worth colouring — `npm`, `pnpm` — and its
 * flags are the quiet structure, the way an attribute is inside a tag.
 */
const createShellScanner = () => {
  // A line starts with its command; everything after it is an argument.
  let head = true;
  return (source: string): Token[] => {
    const out: Token[] = [];
    const take = (kind: Kind, text: string) => out.push({ kind, text });

    let i = 0;
    while (i < source.length) {
      const rest = source.slice(i);
      const space = SPACE.exec(rest)?.[0];
      if (space) {
        take("plain", space);
        if (space.includes("\n")) head = true;
        i += space.length;
        continue;
      }
      const comment = SHELL_COMMENT.exec(rest)?.[0];
      if (comment) {
        take("dim", comment);
        i += comment.length;
        continue;
      }
      const string = STRING.exec(rest)?.[0];
      if (string) {
        take("str", string);
        head = false;
        i += string.length;
        continue;
      }
      // A `$` is the prompt someone copied, not part of the command.
      if (rest[0] === "$") {
        take("dim", "$");
        i += 1;
        continue;
      }
      const flag = SHELL_FLAG.exec(rest)?.[0];
      if (flag) {
        take("attr", flag);
        head = false;
        i += flag.length;
        continue;
      }
      const word = SHELL_WORD.exec(rest)?.[0] ?? rest[0];
      take(head ? "api" : "plain", word);
      head = false;
      i += word.length;
    }

    return out;
  };
};

/* CSS: a selector, a property, a value. The three the styling page is about. */
const CSS_NAME = /^-{0,2}[A-Za-z_][\w-]*/;
const CSS_NUMBER = /^-?\d[\w.%]*/;

/**
 * CSS. Selectors read as tags, properties as attributes, and a custom property
 * keeps the attribute colour wherever it appears, including inside a `var()`,
 * because that is the name the page is pointing at.
 */
const createCssScanner = () => {
  let depth = 0;
  // Between the `:` and the `;`, names are values rather than properties.
  let value = false;

  return (source: string): Token[] => {
    const out: Token[] = [];
    const take = (kind: Kind, text: string) => out.push({ kind, text });

    let i = 0;
    while (i < source.length) {
      const rest = source.slice(i);
      const space = SPACE.exec(rest)?.[0];
      if (space) {
        take("plain", space);
        i += space.length;
        continue;
      }
      const comment = BLOCK_COMMENT.exec(rest)?.[0];
      if (comment) {
        take("dim", comment);
        i += comment.length;
        continue;
      }
      const string = STRING.exec(rest)?.[0];
      if (string) {
        take("str", string);
        i += string.length;
        continue;
      }

      const char = rest[0];
      if (char === "{" || char === "}" || char === ";" || char === ":") {
        if (char === "{") depth += 1;
        if (char === "}") depth = Math.max(0, depth - 1);
        if (char === ":" && depth > 0 && !value) value = true;
        else if (char !== ":") value = false;
        take("dim", char);
        i += 1;
        continue;
      }

      const name = CSS_NAME.exec(rest)?.[0];
      if (name) {
        const custom = name.startsWith("--");
        take(depth === 0 ? "tag" : !value || custom ? "attr" : "plain", name);
        i += name.length;
        continue;
      }
      const number = CSS_NUMBER.exec(rest)?.[0];
      if (number) {
        take("plain", number);
        i += number.length;
        continue;
      }
      take("dim", char);
      i += 1;
    }

    return out;
  };
};

const JSON_ATOM = /^(?:true|false|null|-?\d[\d.eE+-]*)/;

/** JSON. Keys are the structure, values are the literal text. */
const createJsonScanner = () => (source: string): Token[] => {
  const out: Token[] = [];
  const take = (kind: Kind, text: string) => out.push({ kind, text });

  let i = 0;
  while (i < source.length) {
    const rest = source.slice(i);
    const space = SPACE.exec(rest)?.[0];
    if (space) {
      take("plain", space);
      i += space.length;
      continue;
    }
    const string = STRING.exec(rest)?.[0];
    if (string) {
      // What follows a string says whether it was a key or a value.
      const key = /^\s*:/.test(rest.slice(string.length));
      take(key ? "attr" : "str", string);
      i += string.length;
      continue;
    }
    const atom = JSON_ATOM.exec(rest)?.[0];
    if (atom) {
      take("plain", atom);
      i += atom.length;
      continue;
    }
    take("dim", rest[0]);
    i += 1;
  }

  return out;
};

const createScanner = (lang: CodeLang) => {
  if (lang === "bash" || lang === "sh") return createShellScanner();
  if (lang === "css") return createCssScanner();
  if (lang === "json") return createJsonScanner();
  if (lang === "text") return (source: string): Token[] => [
    { kind: "plain", text: source },
  ];
  return createTypeScriptScanner();
};

const paint = (tokens: Token[]): ReactNode =>
  tokens.map((token, index) =>
    CLASS[token.kind] ? (
      <span key={index} className={CLASS[token.kind]}>
        {token.text}
      </span>
    ) : (
      <Fragment key={index}>{token.text}</Fragment>
    ),
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
      {note ? <span className="label text-accent">{note}</span> : null}
    </div>
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);

/**
 * A snippet. Strings are scanned; anything else is dropped in as it is, which
 * is how the live example puts an editable passage inside its code.
 *
 * `wrap` is on by default because the landing page sets its snippets beside
 * prose, where a scrollbar would be a surprise. The docs turn it off: a fenced
 * snippet keeps its own line breaks and scrolls inside its own box.
 */
export const Code = ({
  lang = "tsx",
  wrap = true,
  children,
}: {
  lang?: CodeLang;
  wrap?: boolean;
  children: ReactNode;
}) => {
  const scan = createScanner(lang);
  return (
    <pre
      className={`code overflow-x-auto px-4 py-4 sm:px-5 sm:py-5 ${
        wrap ? "whitespace-pre-wrap" : "whitespace-pre"
      }`}
    >
      <code>
        {Children.toArray(children).map((child, index) =>
          typeof child === "string" ? (
            <Fragment key={index}>{paint(scan(child))}</Fragment>
          ) : (
            child
          ),
        )}
      </code>
    </pre>
  );
};
