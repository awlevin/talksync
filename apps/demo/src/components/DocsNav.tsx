"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DOCS_PAGES, editUrl } from "./docs-pages";

/**
 * The docs nav, in two shapes.
 *
 * Wide, it is a column beside the prose and stays put while the page scrolls.
 * Narrow, there is no room for a column, so the same list becomes one scrolling
 * row above the content — the pages are five, and five fit.
 */
export const DocsNav = () => {
  const here = usePathname();

  return (
    <nav
      aria-label="Docs"
      className="border-b border-rule py-3 lg:sticky lg:top-0 lg:self-start lg:border-b-0 lg:py-10"
    >
      <div className="label mb-3 hidden lg:block">Docs</div>
      <ul className="-mx-5 flex gap-1 overflow-x-auto px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0">
        {DOCS_PAGES.map((page) => {
          const current = here === page.href;
          return (
            <li key={page.href} className="shrink-0 lg:shrink">
              <a
                href={page.href}
                aria-current={current ? "page" : undefined}
                className={`block whitespace-nowrap rounded px-2.5 py-1.5 text-[0.875rem] leading-snug lg:whitespace-normal lg:rounded-none lg:border-l lg:px-3 lg:py-1.5 ${
                  current
                    ? "bg-sunken font-medium text-ink lg:bg-transparent lg:border-accent lg:text-accent"
                    : "text-ink-2 hover:text-ink lg:border-rule"
                }`}
              >
                {page.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

/**
 * What is on this page. The headings already carry ids, so the rail is read
 * off the rendered article rather than kept in a second list that could
 * disagree with the first. It only appears where there is room beside the
 * measure, which is why the prose does not depend on it.
 */
export const DocsToc = () => {
  const here = usePathname();
  const [headings, setHeadings] = useState<{ id: string; text: string }[]>([]);

  useEffect(() => {
    setHeadings(
      Array.from(document.querySelectorAll<HTMLElement>("article h2[id]")).map(
        (h) => ({ id: h.id, text: h.textContent ?? "" }),
      ),
    );
  }, [here]);

  if (headings.length === 0) return null;

  return (
    <nav
      aria-label="On this page"
      className="sticky top-0 hidden self-start py-10 xl:block"
    >
      <div className="label mb-3">On this page</div>
      <ul className="space-y-1.5">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              className="block text-[0.8125rem] leading-snug text-ink-2 hover:text-accent"
              href={`#${heading.id}`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

/** Where to go next, and where the page you are reading actually lives. */
export const DocsFoot = () => {
  const here = usePathname();
  const index = DOCS_PAGES.findIndex((page) => page.href === here);
  if (index < 0) return null;

  const previous = DOCS_PAGES[index - 1];
  const next = DOCS_PAGES[index + 1];

  return (
    <footer className="mt-14 border-t border-rule pt-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {previous ? (
          <a className="group block" href={previous.href}>
            <div className="label mb-1">Previous</div>
            <div className="text-[0.9375rem] text-ink-2 group-hover:text-accent">
              {previous.title}
            </div>
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a className="group block sm:text-right" href={next.href}>
            <div className="label mb-1">Next</div>
            <div className="text-[0.9375rem] text-ink-2 group-hover:text-accent">
              {next.title}
            </div>
          </a>
        ) : null}
      </div>

      <a
        className="label mt-8 inline-block hover:text-accent"
        href={editUrl(DOCS_PAGES[index])}
        target="_blank"
        rel="noreferrer"
      >
        Edit this page on GitHub
      </a>
    </footer>
  );
};
