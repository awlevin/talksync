import { describe, expect, it } from "vitest";
import {
  collectDocument,
  DEFAULT_SKIP,
  documentFromText,
  documentSignature,
  type SayInfo,
} from "../document.js";

const rules = { skip: DEFAULT_SKIP };

/** What the aligner is asked for, block by block. */
const blocks = (document: ReturnType<typeof collectDocument>) =>
  document.segments.map((s) => [s.start, s.end, s.text]);

/** The words that are said and never shown. */
const unshown = (document: ReturnType<typeof collectDocument>) =>
  document.words.filter((_, index) => document.hidden[index] === 1);

describe("collectDocument - walking a tree", () => {
  it("reads a heading and its paragraphs as one document in order", () => {
    const document = collectDocument(
      <>
        <h2>What is living inside</h2>
        <p>Wild yeasts eat sugars.</p>
        <p>The bacteria turn it sour.</p>
      </>,
      rules,
    );

    expect(document.words).toEqual([
      "What", "is", "living", "inside",
      "Wild", "yeasts", "eat", "sugars.",
      "The", "bacteria", "turn", "it", "sour.",
    ]);
    expect(blocks(document)).toEqual([
      [0, 4, "What is living inside"],
      [4, 8, "Wild yeasts eat sugars."],
      [8, 13, "The bacteria turn it sour."],
    ]);
  });

  it("keeps a link inside the sentence it sits in", () => {
    const document = collectDocument(
      <p>
        Feed it with <a href="/rye">rye</a> or wheat.
      </p>,
      rules,
    );

    expect(document.words).toEqual([
      "Feed", "it", "with", "rye", "or", "wheat.",
    ]);
    expect(blocks(document)).toEqual([[0, 6, "Feed it with rye or wheat."]]);
  });

  it("gives every list item and blockquote its own block", () => {
    const document = collectDocument(
      <div>
        <ul>
          <li>Flour and water.</li>
          <li>Time and warmth.</li>
        </ul>
        <blockquote>A quiet aside.</blockquote>
      </div>,
      rules,
    );

    expect(blocks(document)).toEqual([
      [0, 3, "Flour and water."],
      [3, 6, "Time and warmth."],
      [6, 9, "A quiet aside."],
    ]);
  });

  it("indexes words across the whole document, not per block", () => {
    const document = collectDocument(
      <>
        <h2>One two</h2>
        <p>Three four five</p>
        <p>Six</p>
      </>,
      rules,
    );

    expect(document.words).toHaveLength(6);
    expect(document.segments.map((s) => s.start)).toEqual([0, 2, 5]);
    expect(document.segments.map((s) => s.end)).toEqual([2, 5, 6]);
  });
});

/** What each block is, so the voice can be told how to read it. */
const kinds = (document: ReturnType<typeof collectDocument>) =>
  document.segments.map((s) => s.kind);

describe("collectDocument - what each block is", () => {
  it("names a heading, a paragraph, a list item and a quote", () => {
    const document = collectDocument(
      <div>
        <h2>The title</h2>
        <p>The prose.</p>
        <ul>
          <li>One thing.</li>
          <li>Another thing.</li>
        </ul>
        <blockquote>A quiet aside.</blockquote>
      </div>,
      rules,
    );

    expect(kinds(document)).toEqual([
      "heading",
      "paragraph",
      "list",
      "list",
      "quote",
    ]);
  });

  it("reads every heading level as a heading", () => {
    const document = collectDocument(
      <>
        <h1>One</h1>
        <h3>Three</h3>
        <h6>Six</h6>
      </>,
      rules,
    );

    expect(kinds(document)).toEqual(["heading", "heading", "heading"]);
  });

  it("keeps the quote a quote when markdown wraps it in a paragraph", () => {
    // This is what every markdown renderer emits, so the inner `p` must not
    // talk over the block it sits in.
    const document = collectDocument(
      <>
        <blockquote>
          <p>A quiet aside.</p>
        </blockquote>
        <ul>
          <li>
            <p>A loose list item.</p>
          </li>
        </ul>
      </>,
      rules,
    );

    expect(kinds(document)).toEqual(["quote", "list"]);
  });

  it("does not let one block's kind leak into the next", () => {
    const document = collectDocument(
      <>
        <blockquote>A quiet aside.</blockquote>
        <p>Back to prose.</p>
      </>,
      rules,
    );

    expect(kinds(document)).toEqual(["quote", "paragraph"]);
  });

  it("reads a bare string, and anything outside a block, as prose", () => {
    expect(kinds(documentFromText("Any text you like."))).toEqual(["paragraph"]);
    expect(kinds(collectDocument(<div>Loose words.</div>, rules))).toEqual([
      "paragraph",
    ]);
  });
});

describe("collectDocument - skipping", () => {
  it("cuts an inline code span out of the sentence around it", () => {
    const document = collectDocument(
      <p>
        Pass the <code>debounceMs</code> option.
      </p>,
      rules,
    );

    expect(document.words).toEqual(["Pass", "the", "option."]);
    expect(blocks(document)).toEqual([[0, 3, "Pass the  option."]]);
  });

  it("drops a whole block without disturbing the ones around it", () => {
    const document = collectDocument(
      <>
        <p>Before the block.</p>
        <pre>const x = 1;</pre>
        <p>After the block.</p>
      </>,
      rules,
    );

    expect(blocks(document)).toEqual([
      [0, 3, "Before the block."],
      [3, 6, "After the block."],
    ]);
  });

  it("takes a class, an attribute and a predicate", () => {
    const tree = (
      <>
        <p className="footnote">A footnote.</p>
        <p aria-hidden>Hidden text.</p>
        <aside>An aside.</aside>
        <p>The prose.</p>
      </>
    );

    const document = collectDocument(tree, {
      skip: [".footnote", "[aria-hidden]", (el) => el.type === "aside"],
    });

    expect(blocks(document)).toEqual([[0, 2, "The prose."]]);
  });

  it("takes `data-spoken-skip` at the point of authorship", () => {
    const document = collectDocument(
      <>
        <p data-spoken-skip>Not this one.</p>
        <p>This one.</p>
      </>,
      rules,
    );

    expect(blocks(document)).toEqual([[0, 2, "This one."]]);
  });

  it("keeps skipping below a skipped element", () => {
    const document = collectDocument(
      <>
        <aside data-spoken-skip>
          <p>Buried prose.</p>
        </aside>
        <p>Read this.</p>
      </>,
      rules,
    );

    expect(document.words).toEqual(["Read", "this."]);
  });

  it("reads headings unless they are asked not to be", () => {
    const tree = (
      <>
        <h2>A heading</h2>
        <p>A paragraph.</p>
      </>
    );

    expect(collectDocument(tree, rules).words).toEqual([
      "A", "heading", "A", "paragraph.",
    ]);
    expect(
      collectDocument(tree, { skip: [...DEFAULT_SKIP, "h1", "h2", "h3"] }).words,
    ).toEqual(["A", "paragraph."]);
  });
});

describe("collectDocument - only", () => {
  it("fences the field, and `skip` still cuts inside it", () => {
    const document = collectDocument(
      <div>
        <nav>
          <p>Skip to content</p>
        </nav>
        <article className="prose">
          <h2>The title</h2>
          <p>
            The body, with <code>code</code> in it.
          </p>
        </article>
        <footer>
          <p>All rights reserved.</p>
        </footer>
      </div>,
      { skip: DEFAULT_SKIP, only: [".prose"] },
    );

    expect(blocks(document)).toEqual([
      [0, 2, "The title"],
      [2, 7, "The body, with  in it."],
    ]);
  });

  it("says nothing when nothing matches", () => {
    const document = collectDocument(<p>Anything at all.</p>, {
      only: [".prose"],
    });
    expect(document.words).toEqual([]);
    expect(document.segments).toEqual([]);
  });

  it("takes `data-spoken` as the per-element opt in", () => {
    const document = collectDocument(
      <div>
        <p>Not this.</p>
        <p data-spoken>This one.</p>
      </div>,
      { only: [".prose"] },
    );

    expect(document.words).toEqual(["This", "one."]);
  });
});

describe("collectDocument - saying what is not on the page", () => {
  it("announces every heading, numbering them as it goes", () => {
    const document = collectDocument(
      <>
        <h2>What is living in there</h2>
        <p>Wild yeasts eat sugars.</p>
        <h2>Feeding it</h2>
        <p>One part starter.</p>
        <h2>Reading the jar</h2>
      </>,
      { ...rules, say: { h2: ({ count }) => ({ before: `Section ${count}.` }) } },
    );

    expect(blocks(document)).toEqual([
      [0, 7, "Section 1. What is living in there"],
      [7, 11, "Wild yeasts eat sugars."],
      [11, 15, "Section 2. Feeding it"],
      [15, 18, "One part starter."],
      [18, 23, "Section 3. Reading the jar"],
    ]);
    expect(unshown(document)).toEqual([
      "Section", "1.", "Section", "2.", "Section", "3.",
    ]);
  });

  it("speaks after the element's own words as well as before them", () => {
    const document = collectDocument(
      <blockquote>Bread is warm.</blockquote>,
      { ...rules, say: { blockquote: () => ({ after: "End of quotation." }) } },
    );

    expect(blocks(document)).toEqual([
      [0, 6, "Bread is warm. End of quotation."],
    ]);
    expect(unshown(document)).toEqual(["End", "of", "quotation."]);
  });

  it("replaces what an element says when the rule returns a string", () => {
    const document = collectDocument(
      <>
        <p>Before.</p>
        <p className="figure">3.14159265</p>
      </>,
      { ...rules, say: { ".figure": () => "Pi, near enough." } },
    );

    expect(blocks(document)).toEqual([
      [0, 1, "Before."],
      [1, 4, "Pi, near enough."],
    ]);
    // The element's own words are said by the rule instead, so none of them
    // are in the document.
    expect(document.words).toEqual(["Before.", "Pi,", "near", "enough."]);
  });

  it("speaks in place of a skipped block, as a block of its own", () => {
    const document = collectDocument(
      <>
        <p>Before the block.</p>
        <pre>const x = 1;</pre>
        <p>After the block.</p>
      </>,
      { ...rules, say: { pre: () => "Code sample skipped." } },
    );

    expect(blocks(document)).toEqual([
      [0, 3, "Before the block."],
      [3, 6, "Code sample skipped."],
      [6, 9, "After the block."],
    ]);
    expect(unshown(document)).toEqual(["Code", "sample", "skipped."]);
  });

  it("speaks in place of an inline skip, inside the sentence", () => {
    const document = collectDocument(
      <p>
        Pass the <code>debounceMs</code> option.
      </p>,
      { ...rules, say: { code: () => "a debounce setting" } },
    );

    expect(blocks(document)).toEqual([
      [0, 6, "Pass the a debounce setting  option."],
    ]);
    expect(unshown(document)).toEqual(["a", "debounce", "setting"]);
  });

  it("hands the rule what the element says, after skipping", () => {
    const seen: SayInfo[] = [];
    const note = (info: SayInfo) => {
      seen.push(info);
      return null;
    };

    collectDocument(
      <>
        <h2>Feeding it</h2>
        <p>
          Pass the <code>debounceMs</code> option.
        </p>
        <pre>const x = 1;</pre>
      </>,
      { ...rules, say: { h2: note, p: note, pre: note } },
    );

    expect(seen.map((info) => [info.kind, info.text])).toEqual([
      ["heading", "Feeding it"],
      ["paragraph", "Pass the  option."],
      // Nothing of a skipped element is said, so the rule is handed nothing.
      ["paragraph", ""],
    ]);
  });

  it("counts every match, including the ones that say nothing", () => {
    const counted: number[] = [];
    const document = collectDocument(
      <>
        <p>One.</p>
        <p>Two.</p>
        <p>Three.</p>
      </>,
      {
        ...rules,
        say: {
          p: ({ count }) => {
            counted.push(count);
            return count === 2 ? { before: "The second one." } : null;
          },
        },
      },
    );

    expect(counted).toEqual([1, 2, 3]);
    expect(unshown(document)).toEqual(["The", "second", "one."]);
  });

  it("takes the first rule that matches an element", () => {
    const document = collectDocument(
      <h2 className="titled">Feeding it</h2>,
      {
        ...rules,
        say: {
          h2: () => ({ before: "The first rule." }),
          ".titled": () => ({ before: "The second rule." }),
        },
      },
    );

    expect(blocks(document)).toEqual([
      [0, 5, "The first rule. Feeding it"],
    ]);
  });

  it("says nothing outside an `only` fence", () => {
    const document = collectDocument(
      <div>
        <pre>const x = 1;</pre>
        <article className="prose">
          <p>The body.</p>
          <pre>const y = 2;</pre>
        </article>
      </div>,
      {
        skip: DEFAULT_SKIP,
        only: [".prose"],
        say: { pre: () => "Code sample skipped." },
      },
    );

    expect(blocks(document)).toEqual([
      [0, 2, "The body."],
      [2, 5, "Code sample skipped."],
    ]);
  });

  it("is a different reading when the rule says something else", () => {
    const tree = <h2>Feeding it</h2>;
    const signature = (announcement?: string) =>
      documentSignature(
        collectDocument(tree, {
          ...rules,
          say: announcement ? { h2: () => ({ before: announcement }) } : undefined,
        }),
      );

    expect(signature("Section one.")).toBe(signature("Section one."));
    expect(signature("Section one.")).not.toBe(signature("Section two."));
    expect(signature("Section one.")).not.toBe(signature());
  });
});
