import { Fragment } from "react";
import { Code, Pane } from "@/components/code";
import { InstallLine } from "@/components/InstallLine";
import { LiveExample } from "@/components/LiveExample";
import { Mark } from "@/components/Mark";
import { SpeechStage, Talkable } from "@/components/Talkable";

const REPO = "https://github.com/awlevin/spoken-text";

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

const Lede = ({ children, code }: { children: string; code?: string[] }) => (
  <Talkable
    code={code}
    className="mb-8 mt-3 max-w-[64ch] text-[0.9375rem] leading-relaxed text-ink-2"
  >
    {children}
  </Talkable>
);

const Row = ({
  name,
  type,
  code,
  children,
}: {
  name: string;
  type: string;
  code?: string[];
  children: string;
}) => (
  <div className="grid grid-cols-1 gap-x-6 gap-y-1 border-t border-rule py-3 sm:grid-cols-[minmax(0,10rem)_1fr]">
    <div className="min-w-0">
      <div className="font-mono text-[0.8125rem] font-medium text-accent">
        {name}
      </div>
      <div className="font-mono text-[0.6875rem] leading-relaxed text-ink-2">
        {type}
      </div>
    </div>
    <Talkable code={code} className="text-[0.9375rem] leading-relaxed text-ink-2">
      {children}
    </Talkable>
  </div>
);

const Cluster = ({ title, names }: { title: string; names: string }) => (
  <div className="border-t border-rule py-3">
    <div className="label mb-1.5">{title}</div>
    <p className="font-mono text-[0.8125rem] leading-relaxed text-ink">
      {names}
    </p>
  </div>
);

const Exports = ({ from, names }: { from: string; names: string }) => (
  <div className="border-t border-rule py-3">
    <div className="path mb-1.5">from &ldquo;{from}&rdquo;</div>
    <p className="font-mono text-[0.8125rem] leading-relaxed text-ink">
      {names}
    </p>
  </div>
);

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-page px-5 sm:px-8 lg:px-12">
      <header className="flex items-center justify-between border-b border-rule py-5">
        <div className="flex items-center gap-2.5">
          <Mark className="h-7 w-7" />
          <span className="font-mono text-[0.9375rem] font-semibold tracking-tight">
            spoken-text
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <a className="label hover:text-accent" href="/article">
            Whole article
          </a>
          <a className="label hidden hover:text-accent sm:inline" href="/example">
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

          <section className="pb-16 lg:pb-24">
            <SectionRule name="The route" file="server" />
            <Lede code={["<SpokenText>", "/api/transcription"]}>
              &lt;SpokenText&gt; posts the passage to /api/transcription and
              expects audio and word timings back. Mounting that route is the
              other half, and it is one export.
            </Lede>

            <div className="grid grid-cols-1 gap-x-14 gap-y-8 lg:grid-cols-[1.15fr_1fr]">
              <div className="panel overflow-hidden">
                <Pane file="app/api/transcription/route.ts">
                  <Code>{`import {
  createAlignmentHandler,
  elevenlabsSpeech,
  vercelBlobCache,
} from "spoken-text/server";

export const POST = createAlignmentHandler({
  speech: elevenlabsSpeech({
    voiceSettings: (kind) =>
      kind === "heading"
        ? { speed: 0.9, stability: 0.6 }
        : undefined,
  }),
  cache: vercelBlobCache(),
});`}</Code>
                </Pane>
              </div>

              <dl className="text-[0.9375rem] leading-relaxed">
                <div className="border-t border-rule py-3.5">
                  <dt className="label mb-1.5">It is a plain handler</dt>
                  <dd className="text-ink-2">
                    <Talkable
                      code={["(Request)", "=>", "Response", "{", "content,", "kind", "}"]}
                    >
                      A (Request) =&gt; Response that reads &#123; content, kind
                      &#125; and returns audio plus word-level timings. It mounts
                      anywhere that speaks the web standard, not only Next.js.
                    </Talkable>
                  </dd>
                </div>
                <div className="border-t border-rule py-3.5">
                  <dt className="label mb-1.5">One call, not two</dt>
                  <dd className="text-ink-2">
                    <Talkable code={["elevenlabsSpeech", "tts-1", "whisper-1", "transcribe"]}>
                      elevenlabsSpeech returns the audio and a timestamp for
                      every character in one call, so there is nothing to
                      transcribe and nothing to drift. tts-1 with whisper-1 is
                      still there, as a speech and a transcribe you pass in.
                    </Talkable>
                  </dd>
                </div>
                <div className="border-t border-rule py-3.5">
                  <dt className="label mb-1.5">Every block says what it is</dt>
                  <dd className="text-ink-2">
                    <Talkable code={["kind", "heading", "paragraph", "list", "quote"]}>
                      A heading, a paragraph, a list item or a quote: the kind
                      travels with the text, so a voice can read a title like a
                      title. It is part of the cache key too.
                    </Talkable>
                  </dd>
                </div>
                <div className="border-t border-rule py-3.5">
                  <dt className="label mb-1.5">The adapters are opt-in</dt>
                  <dd className="text-ink-2">
                    <Talkable
                      code={[
                        "elevenlabsSpeech",
                        "openaiSpeech",
                        "vercelBlobCache",
                        "speech",
                        "transcribe",
                        "cache",
                      ]}
                    >
                      elevenlabsSpeech, openaiSpeech and vercelBlobCache ship
                      with the package, but nothing depends on them. Pass your own
                      speech, transcribe and cache and the package asks for
                      nothing but React.
                    </Talkable>
                  </dd>
                </div>
                <div className="border-t border-rule py-3.5">
                  <dt className="label mb-1.5">Generated once, ever</dt>
                  <dd className="text-ink-2">
                    <Talkable code={["data:"]}>
                      The cache key is a hash of the passage and its kind, so
                      identical text hits the same entry. Without a cache the
                      audio comes back inline as a data: URL, which is fine for
                      a first run and wrong for anything after it.
                    </Talkable>
                  </dd>
                </div>
                <div className="border-t border-rule py-3.5">
                  <dt className="label mb-1.5">Environment</dt>
                  <dd className="text-ink-2">
                    <Talkable code={["ELEVENLABS_API_KEY", "BLOB_READ_WRITE_TOKEN"]}>
                      These two adapters read ELEVENLABS_API_KEY and
                      BLOB_READ_WRITE_TOKEN.
                    </Talkable>
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="pb-16 lg:pb-24">
            <SectionRule name="A whole document" file="provider" />
            <Lede code={["<SpokenText>", "<SpokenTextProvider>", "<Player>"]}>
              Hand &lt;SpokenText&gt; a heading and its paragraphs instead of a
              string. Each block is its own alignment request, so the first one
              is fetched on mount, the next is warmed while it plays, and the
              highlight runs the length of the page.
            </Lede>

            <div className="grid grid-cols-1 gap-x-14 gap-y-8 lg:grid-cols-[1.15fr_1fr]">
              <div className="panel overflow-hidden">
                <Pane file="app/article/page.tsx">
                  <Code>{`<SpokenTextProvider>
  <header className="sticky top-0">
    <Player />
  </header>

  <SpokenText>
    <h1>A jar of flour and water</h1>
    <p>A sourdough starter is the…</p>
    <h2>Feeding it</h2>
    <p>One part starter, five parts…</p>
  </SpokenText>
</SpokenTextProvider>`}</Code>
                </Pane>
              </div>

              <dl className="text-[0.9375rem] leading-relaxed">
                <div className="border-t border-rule py-3.5">
                  <dt className="label mb-1.5">One playhead</dt>
                  <dd className="text-ink-2">
                    <Talkable code={["currentWordIndex", "segments"]}>
                      currentWordIndex is one number across the whole document,
                      and segments says where each block starts and ends. A
                      string is a document with one block, so nothing about a
                      single passage changes.
                    </Talkable>
                  </dd>
                </div>
                <div className="border-t border-rule py-3.5">
                  <dt className="label mb-1.5">Fetched as it is reached</dt>
                  <dd className="text-ink-2">
                    <Talkable code={["duration", "durationIsEstimate"]}>
                      Nothing waits on one enormous request. Until every block
                      has landed, duration counts the rest at a reading pace and
                      durationIsEstimate says so, which is why the player shows
                      a tilde.
                    </Talkable>
                  </dd>
                </div>
                <div className="border-t border-rule py-3.5">
                  <dt className="label mb-1.5">The boundary</dt>
                  <dd className="text-ink-2">
                    <Talkable code={["<MyArticle />"]}>
                      The walk sees the elements it is handed, not inside a
                      child component. &lt;MyArticle /&gt; is a closed box. MDX
                      output and hand-written pages are both fine.
                    </Talkable>
                  </dd>
                </div>
                <div className="border-t border-rule py-3.5">
                  <dt className="label mb-1.5">Left unspoken</dt>
                  <dd className="text-ink-2">
                    <Talkable code={["code", "pre", "1:5:5", "skip", "only"]}>
                      code, pre and the rest of the things nobody wants read
                      aloud are skipped by default, and still render where they
                      were written. The article steps over its 1:5:5 and its
                      feeding table, and the words either side stay in time.
                      skip and only take it further.
                    </Talkable>
                  </dd>
                </div>
                <div className="border-t border-rule py-3.5">
                  <dt className="label mb-1.5">See it running</dt>
                  <dd className="text-ink-2">
                    <a
                      className="text-accent underline decoration-dotted underline-offset-4"
                      href="/article"
                    >
                      An article, read end to end
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="pb-16 lg:pb-24">
            <SectionRule name="The API" file="exports" />
            <Lede>The whole surface, so you can see where the escape hatches are.</Lede>

            <div className="grid grid-cols-1 gap-x-14 gap-y-12 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <div className="api-head mb-2">&lt;SpokenText&gt;</div>
                <Row name="children" type="string | ReactNode" code={["<h2>", "<p>"]}>
                  A passage, or a tree of elements. Headings and paragraphs keep
                  their tags; each one becomes its own alignment request.
                </Row>
                <Row
                  name="speech"
                  type="SpokenTextController"
                  code={["useSpokenText", "<SpokenTextProvider>"]}
                >
                  A controller from useSpokenText. Left out, it reads the
                  nearest &lt;SpokenTextProvider&gt;, and otherwise manages
                  itself.
                </Row>
                <Row
                  name="skip"
                  type="(string | (el) => boolean)[]"
                  code={["code", "pre", ".footnote", "[aria-hidden]"]}
                >
                  Parts of the tree to leave unspoken. A tag, a .class, an
                  [attr], or a predicate. Defaults to code, pre and the rest of
                  the things nobody wants read aloud.
                </Row>
                <Row
                  name="only"
                  type="(string | (el) => boolean)[]"
                  code={[".prose", "data-spoken"]}
                >
                  Speak only these parts of the tree. Unset means all of it.
                  data-spoken and data-spoken-skip are the per-element forms.
                </Row>
                <Row
                  name="classNames"
                  type="{ word, past, current, future, separator }"
                >
                  Your classes per word state, and for the gaps between them,
                  which carry the band from one word to the next. Supplying one
                  drops the built-in look for that slot, so your CSS is not
                  fighting inline styles.
                </Row>
                <Row name="renderWord" type="(word: DisplayWord) => ReactNode">
                  Take over word rendering entirely. Whitespace is still inserted
                  for you.
                </Row>
                <Row
                  name="onWordChange"
                  type="(index, word) => void"
                  code={["-1"]}
                >
                  Fires whenever the spoken word changes. Index -1 means nothing
                  has been said yet.
                </Row>
                <Row name="endpoint" type={'string = "/api/transcription"'}>
                  Where the passage is posted.
                </Row>
                <Row
                  name="fetchAlignment"
                  type="(text, { kind }) => Promise<Alignment>"
                >
                  Skip the route and resolve audio and timings yourself.
                </Row>
                <Row
                  name="as"
                  type={'"p" | "div" | "span" | …'}
                  code={["className", "style"]}
                >
                  Element it renders into: div for a tree, p for a string. Also
                  takes className and style.
                </Row>
                <Row name="seekOnWordClick" type="boolean = true">
                  Click a word to hear the document from there, fetching its
                  block if it has not been asked for yet.
                </Row>
                <Row name="autoPlay" type="boolean = false">
                  Speak as soon as the audio is ready.
                </Row>
                <Row name="debounceMs" type="number = 0">
                  How long to wait after the text stops changing before fetching.
                </Row>
              </div>

              <div>
                <div className="api-head mb-2">useSpokenText(text, options)</div>
                <Talkable className="mb-3 text-[0.9375rem] leading-relaxed text-ink-2">
                  The headless one. It owns the audio and says which word is
                  being spoken; the UI is yours.
                </Talkable>
                <Cluster
                  title="What is being said"
                  names="text · words · currentWordIndex · currentWord · segments (start · end · status · kind)"
                />
                <Cluster
                  title="Where playback is"
                  names="status · isLoading · isPlaying · error · currentTime · duration · durationIsEstimate · audioUrl"
                />
                <Cluster
                  title="Moving it"
                  names="play() · pause() · toggle() · seek(seconds) · seekToWord(index) · seekToFraction(0-1)"
                />
                <Cluster title="The escape hatch" names="getAudioElement()" />

                <div className="api-head mb-2 mt-9">&lt;Player&gt;</div>
                <Row name="speech" type="SpokenTextController">
                  The controller to drive. Left out, it drives the nearest
                  provider, so it can live in a sticky header. A play button and
                  a scrubber; optional, since the text highlights on its own.
                </Row>
                <Row
                  name="classNames"
                  type="{ root, button, track, elapsed, thumb, time, status }"
                  code={["showTime", "showStatus"]}
                >
                  Restyle any part of it. Also takes showTime and showStatus.
                  The total time is dimmed and marked with a tilde while blocks
                  are still loading.
                </Row>

                <div className="api-head mb-2 mt-9">
                  &lt;SpokenTextProvider&gt;
                </div>
                <Row
                  name="children"
                  type="ReactNode"
                  code={["<SpokenText>", "<Player>"]}
                >
                  Holds one controller for the document below it, so the
                  &lt;SpokenText&gt; and the &lt;Player&gt; do not have to be
                  siblings.
                </Row>
                <Row
                  name="options"
                  type="endpoint · fetchAlignment · debounceMs · autoPlay"
                >
                  The same options the hook takes, for the whole document.
                  Anything written on the &lt;SpokenText&gt; inside it wins, so
                  a debounceMs can sit next to the text it is about.
                </Row>

                <div className="panel mt-9 overflow-hidden">
                  <Pane file="a whole page, read as one">
                    <Code>{`<SpokenTextProvider>
  <StickyHeader>
    <Player />
  </StickyHeader>

  <article>
    <SpokenText skip={["code", "figcaption"]}>
      <h2>Feeding it</h2>
      <p>One part starter, five…</p>
    </SpokenText>
  </article>
</SpokenTextProvider>`}</Code>
                  </Pane>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <div className="label mb-2">Also exported</div>
              <div className="grid grid-cols-1 gap-x-14 lg:grid-cols-2">
                <Exports
                  from="spoken-text"
                  names="useSpokenTextController · tokenize · alignTokens · tokenIndexAt · normalizeForAlignment · createEndpointAligner · clearAlignmentCache · DEFAULT_SKIP · DEFAULT_ENDPOINT"
                />
                <Exports
                  from="spoken-text/server"
                  names="createAlignmentHandler · elevenlabsSpeech · openaiSpeech · openaiTranscription · vercelBlobCache · sha256Hex"
                />
              </div>
            </div>
          </section>
        </main>
      </SpeechStage>

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
    </div>
  );
}
