"use client"
import useSound from 'use-sound';
import { nanoid } from "nanoid";
import { useRef, useState } from 'react';
import _ from "lodash";

const TIMESTAMPS = {
  "task": "transcribe",
  "language": "english",
  "duration": 3.549999952316284,
  "text": "Today is a wonderful day to build something people love.",
  "words": [
    {
      "word": "Today",
      "start": 0,
      "end": 0.36000001430511475
    },
    {
      "word": "is",
      "start": 0.36000001430511475,
      "end": 0.5799999833106995
    },
    {
      "word": "a",
      "start": 0.5799999833106995,
      "end": 0.7400000095367432
    },
    {
      "word": "wonderful",
      "start": 0.7400000095367432,
      "end": 1.059999942779541
    },
    {
      "word": "day",
      "start": 1.059999942779541,
      "end": 1.3799999952316284
    },
    {
      "word": "to",
      "start": 1.3799999952316284,
      "end": 1.6799999475479126
    },
    {
      "word": "build",
      "start": 1.6799999475479126,
      "end": 1.7999999523162842
    },
    {
      "word": "something",
      "start": 1.7999999523162842,
      "end": 2.140000104904175
    },
    {
      "word": "people",
      "start": 2.140000104904175,
      "end": 2.5
    },
    {
      "word": "love",
      "start": 2.5,
      "end": 2.8399999141693115
    }
  ]
}

const SPRITES = TIMESTAMPS.words.reduce(
  (acc, obj) => ({ [obj.word + nanoid(4)]: [obj.start, obj.end], ...acc }),
  {}
);

const INIT_TIME_STATE = {
  start: 0,
  currMs: 0,
  timeout: 0,
}

export default function TextToSpeechComponent() {

  const [currWordIndex, setCurrWordIndex] = useState(-1);
  const timeState = useRef<any>(INIT_TIME_STATE);

  const [play, { stop }] = useSound(
    "https://firebasestorage.googleapis.com/v0/b/talksync-a32f9.appspot.com/o/speech.mp3?alt=media&token=b2352bbe-ee92-464f-b609-b3cc67aa211f",
    // {
    //   sprite: SPRITES,
    // }
  );

  const playAudio = () => {
    if (currWordIndex > -1) {
      stop();
      setCurrWordIndex(-1);
      clearInterval(timeState.current.timeout);
      timeState.current = INIT_TIME_STATE;
      play();
    }
    play();
    timeState.current = {
      start: Date.now(),
    }
    const timeout = setInterval(() => {
      const currMs = Date.now() - timeState.current.start;
      timeState.current = {
        currMs,
        ...timeState.current,
      };
      const currWordIndex = TIMESTAMPS.words.findIndex(word => word.start * 1000 <= currMs && word.end * 1000 >= currMs);
      setCurrWordIndex(currWordIndex);
    }, 10)
    timeState.current = { ...timeState.current, timeout };
  }

  const TEXT = `Today is a wonderful day to build something people love!`;
  const [COVERED, REMAINING] = TEXT.split(" ").reduce(
    (acc, word, index) => {
      const covered = acc[0];
      const remaining = acc[1];
      if (index < currWordIndex) {
        return [[...covered, word], remaining];
      } else if (index === currWordIndex) {
        return [[...covered, word], remaining];
      } else {
        return [covered, [...remaining, word]];
      }
    },
    [[] as string[], [] as string[]]
  );

  console.log({ COVERED, REMAINING })

  return (
    <div onClick={playAudio}>
      <span style={{ backgroundColor: "lightgreen" }}>
        {COVERED.join(" ")}
      </span>{" "}
      {REMAINING.join(" ")}
    </div>
  );
}
