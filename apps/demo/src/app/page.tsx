import { Fragment } from "react";
import { Code } from "@/components/code";
import { DOCS_PAGES } from "@/components/docs-pages";
import { InstallLine } from "@/components/InstallLine";
import { LiveExample } from "@/components/LiveExample";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SpeechStage, Talkable } from "@/components/Talkable";

const HEADLINE = "Wrap your text. Hear it read. Watch every word light up.";
const WORDS = HEADLINE.split(" ");

/** The headline says what the package does, and then does it. */
const Headline = () => (
  <h1 className="display sweep text-[2.35rem] font-bold leading-[0.98] sm:text-[3.4rem] lg:text-[4rem]">
    {WORDS.map((word, i) => {
      const stop = word.endsWith(".");
      return (
        <Fragment key={i}>
          <span style={{ animationDelay: `${0.3 + i * 0.15}s` }}>
            {stop ? word.slice(0, -1) : word}
            {stop ? <span className="text-accent">.</span> : null}
          </span>
          {i < WORDS.length - 1 ? " " : null}
        </Fragment>
      );
    })}
  </h1>
);

const SectionRule = ({ name, file }: { name: string; file: string }) => (
  <div className="section-rule">
    <h2 className="display text-[1.35rem] font-semibold text-ink">{name}</h2>
    <span className="label truncate">{file}</span>
  </div>
);

/**
 * One of the three things worth saying on the way past. Each is a sentence and
 * a door: the page that answers it properly is one click away, which is the
 * whole arrangement between this page and the docs.
 */
const Beat = ({
  title,
  href,
  more,
  code,
  children,
}: {
  title: string;
  href: string;
  more: string;
  code?: string[];
  children: string;
}) => (
  <div className="border-t border-rule pt-3.5">
    <div className="label mb-2">{title}</div>
    <Talkable code={code} className="text-[0.9375rem] leading-relaxed text-ink-2">
      {children}
    </Talkable>
    <a
      className="label mt-3 inline-block hover:text-accent"
      href={href}
    >
      {more} →
    </a>
  </div>
);

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-page px-5 sm:px-8 lg:px-12">
      <SiteHeader />

      <SpeechStage>
        <main>
          {/* What it is, said once. */}
          <section className="pt-10 sm:pt-14 lg:pt-16">
            <Headline />
            <Talkable className="mt-7 max-w-[80ch] text-[1.0625rem] leading-[1.6] text-ink-2 sm:text-[1.1875rem]">
              One React component reads your text aloud and lights each word as it
              is said.
            </Talkable>
            {/* Said once, quietly, because the page is doing it everywhere. */}
            <p className="label mt-5">Click any prose on this page to hear it</p>
          </section>

          {/* Then the thing itself. */}
          <section className="rise pb-16 pt-10 sm:pt-12 lg:pb-24 lg:pt-14">
            <LiveExample />
            <Talkable className="mt-3 px-1 text-[0.875rem] leading-relaxed text-ink-2">
              Press play, or click any word to hear the passage from there. Show
              the code and edit the passage to make it say something else.
            </Talkable>
          </section>

          <section className="pb-16 lg:pb-24">
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,23rem)_1fr] lg:gap-6">
              <div className="flex flex-col gap-3">
                <InstallLine />
                <Talkable className="px-1 text-[0.875rem] leading-relaxed text-ink-2">
                  React 18 or 19 is the only requirement. The speech, the
                  transcript and the storage are all functions you pass in.
                </Talkable>
              </div>
              <div className="panel overflow-hidden">
                <Code>{`import { SpokenText } from "spoken-text";

<SpokenText>Any text you like.</SpokenText>`}</Code>
              </div>
            </div>
          </section>

          {/* Three beats, then the door. Everything past this is in the docs. */}
          <section className="pb-16 lg:pb-24">
            <div className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-3">
              <Beat
                title="A passage, or a page"
                href="/docs/documents"
                more="Reading a whole document"
                code={["<SpokenText>", "<h2>", "<p>"]}
              >
                Hand &lt;SpokenText&gt; your headings and paragraphs instead of a
                string and it reads the document. Each block is its own request,
                fetched as it is reached, under one playhead.
              </Beat>
              <Beat
                title="The route is one export"
                href="/docs/server"
                more="The route"
                code={["createAlignmentHandler", "(Request)", "=>", "Response"]}
              >
                createAlignmentHandler is a plain (Request) =&gt; Response that
                turns text into audio and word timings. The speech, the transcript
                and the storage are yours to pass in.
              </Beat>
              <Beat
                title="Styled, or restyled"
                href="/docs/styling"
                more="Styling the highlight"
                code={["renderWord"]}
              >
                Three CSS variables change the colour. A class per word state
                replaces the look entirely. renderWord takes the word itself over.
              </Beat>
            </div>
          </section>

          <section className="pb-16 lg:pb-24">
            <SectionRule name="Read the docs" file="/docs" />
            <ul className="mt-2">
              {DOCS_PAGES.map((page) => (
                <li key={page.href} className="border-b border-rule py-3.5">
                  <a
                    className="display text-[1.05rem] font-semibold text-ink hover:text-accent"
                    href={page.href}
                  >
                    {page.title} →
                  </a>
                  <Talkable className="mt-1 max-w-[70ch] text-[0.9375rem] leading-relaxed text-ink-2">
                    {page.blurb}
                  </Talkable>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </SpeechStage>

      <SiteFooter />
    </div>
  );
}
