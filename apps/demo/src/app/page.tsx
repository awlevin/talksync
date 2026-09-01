import { Fragment } from "react";
import { Api, Code, Dim, Pane } from "@/components/code";
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
              the code and edit the string to make it say something else.
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
                <Code>
                  <Dim>{"import "}</Dim>
                  {"{ "}
                  <Api>SpokenText</Api>
                  {" } "}
                  <Dim>{'from "spoken-text";'}</Dim>
                  {"\n\n<"}
                  <Api>SpokenText</Api>
                  {">Any text you like.</"}
                  <Api>SpokenText</Api>
                  {">"}
                </Code>
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
                  <Code>
                    <Dim>{"import "}</Dim>
                    {"{\n  "}
                    <Api>createAlignmentHandler</Api>
                    {",\n  "}
                    <Api>openaiSpeech</Api>
                    {",\n  "}
                    <Api>openaiTranscription</Api>
                    {",\n  "}
                    <Api>vercelBlobCache</Api>
                    {",\n} "}
                    <Dim>{'from "spoken-text/server";'}</Dim>
                    {"\n\n"}
                    <Dim>{"export const "}</Dim>
                    {"POST = "}
                    <Api>createAlignmentHandler</Api>
                    {"({"}
                    {"\n  speech: "}
                    <Api>openaiSpeech</Api>
                    {'({ model: "tts-1", voice: "nova" }),'}
                    {"\n  transcribe: "}
                    <Api>openaiTranscription</Api>
                    {"({"}
                    {'\n    model: "whisper-1",'}
                    {'\n    language: "en",'}
                    {"\n  }),"}
                    {"\n  cache: "}
                    <Api>vercelBlobCache</Api>
                    {"(),"}
                    {"\n});"}
                  </Code>
                </Pane>
              </div>

              <dl className="text-[0.9375rem] leading-relaxed">
                <div className="border-t border-rule py-3.5">
                  <dt className="label mb-1.5">It is a plain handler</dt>
                  <dd className="text-ink-2">
                    <Talkable code={["(Request)", "=>", "Response", "{", "content", "}"]}>
                      A (Request) =&gt; Response that reads &#123; content &#125;
                      and returns audio plus word-level timings. It mounts
                      anywhere that speaks the web standard, not only Next.js.
                    </Talkable>
                  </dd>
                </div>
                <div className="border-t border-rule py-3.5">
                  <dt className="label mb-1.5">The adapters are opt-in</dt>
                  <dd className="text-ink-2">
                    <Talkable
                      code={[
                        "openaiSpeech",
                        "openaiTranscription",
                        "vercelBlobCache",
                        "speech",
                        "transcribe",
                        "cache",
                      ]}
                    >
                      openaiSpeech, openaiTranscription and vercelBlobCache ship
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
                      The cache key is a hash of the passage, so identical text
                      hits the same entry. Without a cache the audio comes back
                      inline as a data: URL, which is fine for a first run and
                      wrong for anything after it.
                    </Talkable>
                  </dd>
                </div>
                <div className="border-t border-rule py-3.5">
                  <dt className="label mb-1.5">Environment</dt>
                  <dd className="text-ink-2">
                    <Talkable code={["OPENAI_API_KEY", "BLOB_READ_WRITE_TOKEN"]}>
                      Those two adapters read OPENAI_API_KEY and
                      BLOB_READ_WRITE_TOKEN.
                    </Talkable>
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
                <Row name="children" type="string" code={["speech"]}>
                  The passage to speak. Required unless you pass speech.
                </Row>
                <Row
                  name="speech"
                  type="SpokenTextController"
                  code={["useSpokenText", "<Transport>"]}
                >
                  A controller from useSpokenText, so a passage and a
                  &lt;Transport&gt; share one audio element.
                </Row>
                <Row name="classNames" type="{ word, past, current, future }">
                  Your classes per word state. Supplying one drops the built-in
                  look for that slot, so your CSS is not fighting inline styles.
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
                <Row name="fetchAlignment" type="(text) => Promise<Alignment>">
                  Skip the route and resolve audio and timings yourself.
                </Row>
                <Row
                  name="as"
                  type={'"p" | "div" | "span" | …'}
                  code={["className", "style"]}
                >
                  Element the passage renders into. Also takes className and
                  style.
                </Row>
                <Row name="seekOnWordClick" type="boolean = true">
                  Click a word to hear the passage from there.
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
                <Cluster
                  title="What is being said"
                  names="text · words · currentWordIndex · currentWord"
                />
                <Cluster
                  title="Where playback is"
                  names="status · isLoading · isPlaying · error · currentTime · duration · audioUrl"
                />
                <Cluster
                  title="Moving it"
                  names="play() · pause() · toggle() · seek(seconds) · seekToWord(index) · seekToFraction(0-1)"
                />
                <Cluster title="The escape hatch" names="getAudioElement()" />

                <div className="api-head mb-2 mt-9">&lt;Transport&gt;</div>
                <Row name="speech" type="SpokenTextController">
                  The controller to drive. A play button and a scrubber; optional,
                  since the passage highlights on its own.
                </Row>
                <Row
                  name="classNames"
                  type="{ root, button, track, elapsed, thumb, time, status }"
                  code={["showTime", "showStatus"]}
                >
                  Restyle any part of it. Also takes showTime and showStatus.
                </Row>

                <div className="panel mt-9 overflow-hidden">
                  <Pane file="three of those, together">
                    <Code>
                      {"<"}
                      <Api>SpokenText</Api>
                      {'\n  endpoint="/api/speech"'}
                      {'\n  classNames={{ current: "bg-sky-200" }}'}
                      {"\n  onWordChange={(index, word) =>"}
                      {'\n    setCaption(word?.text ?? "")'}
                      {"\n  }"}
                      {"\n>"}
                      {"\n  {text}"}
                      {"\n</"}
                      <Api>SpokenText</Api>
                      {">"}
                    </Code>
                  </Pane>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <div className="label mb-2">Also exported</div>
              <div className="grid grid-cols-1 gap-x-14 lg:grid-cols-2">
                <Exports
                  from="spoken-text"
                  names="tokenize · alignTokens · tokenIndexAt · normalizeForAlignment · createEndpointAligner · clearAlignmentCache · DEFAULT_ENDPOINT"
                />
                <Exports
                  from="spoken-text/server"
                  names="createAlignmentHandler · openaiSpeech · openaiTranscription · vercelBlobCache · sha256Hex"
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
