/**
 * The docs, in reading order.
 *
 * One list, so the sidebar, the prev/next links, the "Edit on GitHub" link and
 * the block on the landing page all say the same thing. `file` is the path in
 * the repository, which is the only part a reader cannot derive from `href`.
 */
export type DocsPage = {
  href: string;
  /** Sidebar and prev/next label. */
  title: string;
  /** One line, on the landing page and under the page's own heading. */
  blurb: string;
  /** Where the page lives, relative to the repository root. */
  file: string;
};

export const DOCS_PAGES: readonly DocsPage[] = [
  {
    href: "/docs",
    title: "Getting started",
    blurb: "Install it, mount the route, and hear a passage read back. Five minutes.",
    file: "apps/demo/src/app/docs/page.mdx",
  },
  {
    href: "/docs/documents",
    title: "Reading a whole document",
    blurb:
      "Hand it a page of elements. Blocks, lazy loading, what is left unspoken, and what is said that is not written.",
    file: "apps/demo/src/app/docs/documents/page.mdx",
  },
  {
    href: "/docs/styling",
    title: "Styling the highlight",
    blurb:
      "Classes, data attributes and three CSS variables. Or take word rendering over entirely.",
    file: "apps/demo/src/app/docs/styling/page.mdx",
  },
  {
    href: "/docs/server",
    title: "The route",
    blurb:
      "One export, the bundled adapters, and how to bring your own speech, transcription and cache.",
    file: "apps/demo/src/app/docs/server/page.mdx",
  },
  {
    href: "/docs/api",
    title: "Reference",
    blurb: "Every prop, every field on the controller, and everything exported.",
    file: "apps/demo/src/app/docs/api/page.mdx",
  },
];

export const REPO = "https://github.com/awlevin/spoken-text";

export const editUrl = (page: DocsPage): string =>
  `${REPO}/edit/main/${page.file}`;
