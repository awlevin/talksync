"use client";
import { useEffect, useState } from 'react';
import { Transcription } from '@/types/audioTypes';

const LOOKAHEAD_SECONDS = 0.35;

interface UseHighlightTextProps {
  transcription: Transcription | undefined;
  currentTime: number;
  isPlaying: boolean;
  resetKey: string;
}

export const useHighlightText = ({
  transcription,
  currentTime,
  isPlaying,
  resetKey,
}: UseHighlightTextProps) => {
  const [currWordIndex, setCurrWordIndex] = useState(-1);

  useEffect(() => {
    if (!transcription || !isPlaying) return;
    const newWordIndex = transcription.words.findLastIndex(
      (w) => w.start <= currentTime + LOOKAHEAD_SECONDS,
    );
    if (newWordIndex !== -1) setCurrWordIndex(newWordIndex);
  }, [isPlaying, currentTime, transcription]);

  useEffect(() => {
    setCurrWordIndex(-1);
  }, [resetKey]);

  return { currWordIndex };
};
