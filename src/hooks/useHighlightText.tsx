"use client"
import { useEffect, useState } from 'react';
import _ from "lodash";
import { Transcription } from '@/types/audioTypes';

interface UseHighlightTextProps {
  content: string | undefined;
  transcription: Transcription | undefined;
  currentTime: number; // Time in ms since the page loaded
  isPlaying: boolean;
}

export const useHighlightText = ({
  content,
  transcription,
  currentTime, // in seconds
  isPlaying,
}: UseHighlightTextProps) => {
  const [currWordIndex, setCurrWordIndex] = useState(-1);

  // Update the current word index based on the current time
  useEffect(() => {
    if (!transcription || !isPlaying) return;

    const newWordIndex = transcription.words.findLastIndex((word) => {
      return word.start <= currentTime + 0.35;
    });

    if (newWordIndex !== -1) {
      setCurrWordIndex(newWordIndex);
    }
  }, [isPlaying, currentTime, transcription]);

  // Reset the word index when the content changes
  useEffect(() => {
    setCurrWordIndex(-1);
  }, [content]);

  // Highlight the current word when the word index changes
  useEffect(() => {
    if (!content || currWordIndex === -1) return;

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

    const highlightedContent = `
      <span style="background-color: lightgreen">${COVERED.join(" ")}</span>
      <span>${REMAINING.join(" ")}</span>`;

    const domContentElement = document.getElementById("content-area");
    if (domContentElement) {
      domContentElement.innerHTML = highlightedContent;
    }
  }, [content, currWordIndex]);

  return { currWordIndex };
};

