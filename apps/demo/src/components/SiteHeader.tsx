import { Mark } from "./Mark";
import { REPO } from "./docs-pages";

/**
 * The bar at the top of every page that has one. `here` dims the link the
 * reader is already on, so the nav says where they are as well as where to go.
 */
export const SiteHeader = ({ here }: { here?: "docs" | "article" }) => (
  <header className="flex items-center justify-between border-b border-rule py-5">
    <a className="flex items-center gap-2.5" href="/">
      <Mark className="h-7 w-7" />
      <span className="whitespace-nowrap font-mono text-[0.9375rem] font-semibold tracking-tight">
        spoken-text
      </span>
    </a>
    {/* Uppercase mono is wide, so the row sheds links rather than wrapping:
        on a phone it is the docs and the source, and nothing else. */}
    <nav className="flex items-center gap-4 sm:gap-6">
      <a
        className={here === "docs" ? "label text-accent" : "label hover:text-accent"}
        aria-current={here === "docs" ? "page" : undefined}
        href="/docs"
      >
        Docs
      </a>
      <a
        className={`label hidden whitespace-nowrap sm:inline ${
          here === "article" ? "text-accent" : "hover:text-accent"
        }`}
        aria-current={here === "article" ? "page" : undefined}
        href="/article"
      >
        Whole article
      </a>
      <a
        className="label hidden whitespace-nowrap hover:text-accent md:inline"
        href="/example"
      >
        Minimal example
      </a>
      <a
        className="label hover:text-accent"
        href={REPO}
        target="_blank"
        rel="noreferrer"
      >
        GitHub
      </a>
    </nav>
  </header>
);
