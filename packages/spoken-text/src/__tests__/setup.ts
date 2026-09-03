import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * jsdom has no media pipeline at all: `play`, `pause` and `load` are stubs
 * that raise "not implemented". Stand in for them, so a test can drive the
 * controller the way a browser drives it.
 *
 * `duration` stays `NaN`, as it is before metadata lands, which is what makes
 * the aligner's own reported duration the one under test.
 */
type MediaState = { paused: boolean; time: number };

const states = new WeakMap<HTMLMediaElement, MediaState>();

const stateOf = (element: HTMLMediaElement): MediaState => {
  let state = states.get(element);
  if (!state) {
    state = { paused: true, time: 0 };
    states.set(element, state);
  }
  return state;
};

const define = (name: string, descriptor: PropertyDescriptor) =>
  Object.defineProperty(HTMLMediaElement.prototype, name, {
    configurable: true,
    ...descriptor,
  });

define("paused", {
  get(this: HTMLMediaElement) {
    return stateOf(this).paused;
  },
});

define("readyState", { get: () => 1 });

define("currentTime", {
  get(this: HTMLMediaElement) {
    return stateOf(this).time;
  },
  set(this: HTMLMediaElement, value: number) {
    stateOf(this).time = value;
  },
});

define("load", {
  value(this: HTMLMediaElement) {
    stateOf(this).time = 0;
    this.dispatchEvent(new Event("loadedmetadata"));
  },
});

define("play", {
  value(this: HTMLMediaElement) {
    stateOf(this).paused = false;
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  },
});

define("pause", {
  value(this: HTMLMediaElement) {
    stateOf(this).paused = true;
    this.dispatchEvent(new Event("pause"));
  },
});

afterEach(cleanup);
