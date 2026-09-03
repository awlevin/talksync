"use client";

import { Player, SpokenText, SpokenTextProvider, type SayRule } from "spoken-text";

/**
 * Words the reader hears and never sees: the section number ahead of each
 * heading, a note where the code sample is, and the drawing's own description,
 * which is on the page only as an `aria-label`.
 *
 * Held outside the component so the walk is not redone on every render.
 */
const say: Record<string, SayRule> = {
  h2: ({ count }) => ({ before: `Section ${count}.` }),
  pre: () => "A short code sample, skipped.",
  svg: ({ element }) => `A drawing. ${element.props["aria-label"]}`,
};

/**
 * A whole document read as one piece.
 *
 * The provider holds the controller, so the player can sit in a sticky bar at
 * the top of the page while the article is somewhere else entirely. Each
 * heading, paragraph, list item and quotation is its own alignment request:
 * the first is fetched on mount, the next is warmed while the current one
 * plays, and a click anywhere in the article fetches that block and starts
 * there.
 *
 * The `pre` block, the drawing and the `1:5:5` inside the paragraph are all
 * left out of the audio by the default skip list, and all still render exactly
 * where they were written. The first two get their own words from `say`.
 */
export const Article = () => (
  <SpokenTextProvider>
    <div className="sticky top-0 z-10 -mx-5 border-b border-rule bg-bg/90 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
      {/* `ch` is font-dependent, so the measure is set in the article's own
          face and only the player's numerals are mono. */}
      <div className="mx-auto max-w-[68ch]">
        <Player className="font-mono" />
      </div>
    </div>

    <article className="mx-auto max-w-[68ch] py-10 sm:py-14">
      <SpokenText
        say={say}
        className="text-[1.0625rem] leading-[1.75] text-ink-2 sm:text-[1.1875rem]"
      >
        <h1 className="display mb-6 text-[2rem] font-bold leading-tight text-ink sm:text-[2.6rem]">
          A jar of flour and water
        </h1>

        <p className="mb-6">
          A sourdough starter is the oldest tool in the kitchen that is also
          alive. Flour, water, a jar, and a week of paying attention, and you
          have something that will raise bread for as long as you keep feeding
          it.
        </p>

        <h2 className="display mb-3 mt-10 text-[1.35rem] font-semibold text-ink">
          What is living in there
        </h2>

        <p className="mb-6">
          Two things, working side by side. Wild yeasts eat the sugars in the
          flour and give off carbon dioxide, and that is what lifts the loaf.
          Lactic acid bacteria eat what the yeasts leave behind and turn it
          gently sour, and that is what keeps the jar safe and gives the bread
          its flavour. Neither of them is added. Both of them arrive on the
          flour.
        </p>

        <h2 className="display mb-3 mt-10 text-[1.35rem] font-semibold text-ink">
          Feeding it
        </h2>

        <p className="mb-6">
          A feeding is one part starter, five parts flour, five parts water, by
          weight. Bakers write it as <code className="font-mono text-[0.85em] text-accent">1:5:5</code>, and once a day is
          plenty for a jar that lives on the counter.
        </p>

        <pre className="mb-6 overflow-x-auto rounded border border-rule bg-panel p-4 font-mono text-[0.8125rem] leading-relaxed">
          {` 20 g  starter
100 g  flour
100 g  water`}
        </pre>

        <p className="mb-6">
          Warm kitchens work faster than cold ones, so the clock is a worse
          guide than the jar itself. If you would rather bake once a week than
          once a day, keep it in the fridge and feed it the night before, the
          way the{" "}
          <a
            className="text-accent underline decoration-dotted underline-offset-4"
            href="/example"
          >
            minimal example
          </a>{" "}
          keeps things small.
        </p>

        <h2 className="display mb-3 mt-10 text-[1.35rem] font-semibold text-ink">
          Reading the jar
        </h2>

        <ul className="mb-6 list-disc space-y-2 pl-6">
          <li>It rises, domes, and then falls. Use it at the dome.</li>
          <li>It should smell of yogurt and apples, never of nail polish.</li>
          <li>A spoonful floats in a glass of water when it is ready.</li>
        </ul>

        <figure className="mb-6">
          {/* The drawing is skipped, like every `svg`. What it shows is in the
              label, and the `say` rule reads that out in its place. */}
          <svg
            role="img"
            aria-label="Three jars in a row: one just fed, one risen and domed, one fallen back."
            viewBox="0 0 240 88"
            className="w-full rounded border border-rule bg-panel p-4"
          >
            <g className="fill-none stroke-rule" strokeWidth="2">
              <rect x="16" y="10" width="56" height="6" rx="2" />
              <rect x="20" y="16" width="48" height="60" rx="4" />
              <rect x="92" y="10" width="56" height="6" rx="2" />
              <rect x="96" y="16" width="48" height="60" rx="4" />
              <rect x="168" y="10" width="56" height="6" rx="2" />
              <rect x="172" y="16" width="48" height="60" rx="4" />
            </g>
            <g className="fill-lit">
              <path d="M20 60h48v12a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4Z" />
              <path d="M96 40q24-18 48 0v32a4 4 0 0 1-4 4h-40a4 4 0 0 1-4-4Z" />
              <path d="M172 52q24 12 48 0v20a4 4 0 0 1-4 4h-40a4 4 0 0 1-4-4Z" />
            </g>
          </svg>
          <figcaption className="mt-2 text-[0.8125rem] text-ink-2/70">
            Just fed, at the dome, and fallen back.
          </figcaption>
        </figure>

        <p className="mb-6">
          A starter that has gone quiet is almost never dead. It is usually
          cold, hungry, or being fed too much at once. Halve the flour, warm the
          room, and give it three days. If you want to watch the whole thing
          read itself again, go{" "}
          <a
            className="text-accent underline decoration-dotted underline-offset-4"
            href="/"
          >
            back to the front page
          </a>
          .
        </p>

        <p className="text-[0.8125rem] text-ink-2/70" data-spoken-skip>
          Written for this demo. Your grandmother&rsquo;s method is better.
        </p>
      </SpokenText>
    </article>
  </SpokenTextProvider>
);
