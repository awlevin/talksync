"use client";
import { useHighlightText, useTranscription } from '@/hooks';
import { Word } from '@/types/audioTypes';
import { Loader2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

interface AudioWidgetProps {
  content: string;
}

export const AudioWidget = ({ content }: AudioWidgetProps) => {
  const { data, error, isLoading } = useTranscription(content);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef<AudioPlayer>(null);

  const { currWordIndex } = useHighlightText({
    transcription: data?.transcription,
    currentTime,
    isPlaying,
    resetKey: content,
  });

  const seekToWord = useCallback((wordIndex: number) => {
    const audio = playerRef.current?.audio.current;
    const word = data?.transcription.words[wordIndex];
    if (!audio || !word) return;
    audio.currentTime = word.startSecond;
    setCurrentTime(word.startSecond);
    void audio.play();
  }, [data]);

  return (
    <div className="space-y-3">
      <HighlightedText
        content={content}
        currWordIndex={currWordIndex}
        words={data?.transcription.words}
        onWordClick={seekToWord}
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating audio…
        </div>
      )}
      {error && (
        <div className="text-sm text-destructive">
          Failed to generate audio: {error.message}
        </div>
      )}

      <AudioPlayer
        ref={playerRef}
        autoPlayAfterSrcChange={false}
        src={data?.audioUrl}
        onListen={(e) => {
          const t = (e.target as HTMLAudioElement).currentTime;
          if (Number.isFinite(t)) setCurrentTime(t);
        }}
        listenInterval={100}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
};

interface HighlightedTextProps {
  content: string;
  currWordIndex: number;
  words: Word[] | undefined;
  onWordClick: (index: number) => void;
}

const HighlightedText = ({ content, currWordIndex, words, onWordClick }: HighlightedTextProps) => {
  const displayWords = content.split(" ");
  const clickable = !!words;
  return (
    <div id="content-area" className="leading-relaxed">
      {displayWords.map((word, i) => {
        const canClick = clickable && i < (words?.length ?? 0);
        const highlighted = i <= currWordIndex;
        return (
          <span key={i}>
            <span
              onClick={canClick ? () => onWordClick(i) : undefined}
              className={[
                "transition-colors rounded-sm",
                highlighted ? "bg-green-200" : "",
                canClick ? "cursor-pointer hover:bg-green-100" : "",
              ].filter(Boolean).join(" ")}
            >
              {word}
            </span>
            {i < displayWords.length - 1 ? " " : ""}
          </span>
        );
      })}
    </div>
  );
};
