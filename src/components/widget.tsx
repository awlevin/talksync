"use client";
import { useHighlightText, useTranscription } from '@/hooks';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

interface AudioWidgetProps {
  content: string;
}

export const AudioWidget = ({ content }: AudioWidgetProps) => {
  const { data, error, isLoading } = useTranscription(content);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const { currWordIndex } = useHighlightText({
    transcription: data?.transcription,
    currentTime,
    isPlaying,
    resetKey: content,
  });

  return (
    <div className="space-y-3">
      <HighlightedText content={content} currWordIndex={currWordIndex} />

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

const HighlightedText = ({ content, currWordIndex }: { content: string; currWordIndex: number }) => {
  const words = content.split(" ");
  return (
    <div id="content-area" className="leading-relaxed">
      {words.map((word, i) => (
        <span
          key={i}
          className={i <= currWordIndex ? "bg-green-200 transition-colors" : "transition-colors"}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </div>
  );
};
