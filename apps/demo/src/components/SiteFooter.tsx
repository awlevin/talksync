import { Mark } from "./Mark";
import { REPO } from "./docs-pages";

export const SiteFooter = () => (
  <footer className="flex flex-col gap-3 border-t border-rule py-8 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-2.5">
      <Mark className="h-5 w-5" />
      <span className="label">MIT · Aaron Levin</span>
    </div>
    <a
      className="label hover:text-accent"
      href={REPO}
      target="_blank"
      rel="noreferrer"
    >
      github.com/awlevin/spoken-text
    </a>
  </footer>
);
