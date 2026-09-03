import type { Metadata } from "next";
import { DocsFoot, DocsNav, DocsToc } from "@/components/DocsNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * Each page sets its own title and description; the card the docs are shared
 * with is the site's, which the root `opengraph-image` already supplies to
 * every route under it. This only says what kind of page it is.
 */
export const metadata: Metadata = {
  openGraph: { type: "article", siteName: "spoken-text" },
  twitter: { card: "summary_large_image" },
};

export default function DocsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto w-full max-w-page px-5 sm:px-8 lg:px-12">
      <SiteHeader here="docs" />

      {/* Wide, the nav is a column beside the prose, and wider still there is
          room for the page's own headings on the other side. Narrow, the grid
          collapses to one track and the nav becomes a row above the prose. */}
      <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start lg:gap-14 xl:grid-cols-[13rem_minmax(0,68ch)_1fr]">
        <DocsNav />
        <div className="min-w-0 max-w-[68ch] pb-8">
          {children}
          <DocsFoot />
        </div>
        <DocsToc />
      </div>

      <SiteFooter />
    </div>
  );
}
