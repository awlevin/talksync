"use client"
import useSound from 'use-sound';
import { useRef, useState } from 'react';
import _ from "lodash";
import { Transcription } from '@/types/audioTypes';

// const SPRITES = transcription.words.reduce(
//   (acc, obj) => ({ [obj.word + nanoid(4)]: [obj.start, obj.end], ...acc }),
//   {}
// );

const INIT_TIME_STATE = {
  start: 0,
  currMs: 0,
  timeout: 0,
}

export default function TextToSpeechComponent({
  content,
  audioUrl,
  transcription,
}: {
  content: string;
  audioUrl: string;
  transcription: Transcription;
}) {

  const [currWordIndex, setCurrWordIndex] = useState(-1);
  const timeState = useRef<any>(INIT_TIME_STATE);

  const [play, { stop }] = useSound(
    audioUrl
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
    };
    const timeout = setInterval(() => {
      const currMs = Date.now() - timeState.current.start;
      timeState.current = {
        currMs,
        ...timeState.current,
      };
      const currWordIndex = transcription.words.findLastIndex(
        (word) => word.start * 1000 <= currMs
      );
      setCurrWordIndex(currWordIndex);
      if (currWordIndex === transcription.words.length - 1) {
        clearInterval(timeState.current.timeout);
      }
    }, 10);
    timeState.current = { ...timeState.current, timeout };
  };

  const [COVERED, REMAINING] = content.split(" ").reduce(
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

  return (
    <div onClick={playAudio}>
      <span style={{ backgroundColor: "lightgreen" }}>{COVERED.join(" ")}</span>{" "}
      {REMAINING.join(" ")}
    </div>
  );
}
