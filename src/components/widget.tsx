import { useHighlightText, useTranscription } from '@/hooks';
import { Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

export const AudioWidget = () => {

  const [isPlaying, setIsPlaying] = useState(false);
  const [currTimestamp, setCurrTimeStamp] = useState(0);
  const { data, error, isLoading } = useTranscription();
  const startTimeRef = useRef<number>(0);
  const listenCallback = (e: Event) => {
    const { timeStamp } = e;
    console.log({ timeStamp })
    setCurrTimeStamp(timeStamp)
  }

  useHighlightText({
    content: data?.transcription.text,
    transcription: data?.transcription,
    currentTime: (currTimestamp - startTimeRef.current) / 1000,
    isPlaying,
  });

  const togglePlay = (e: Event) => {
    setIsPlaying(p => {
      const newIsPlaying = !p;
      // keep start time the same if we're pausing, update if starting
      if (newIsPlaying) {
        startTimeRef.current = newIsPlaying ? e.timeStamp : 0;
      }
      return newIsPlaying;
    });
  }

  return (
    <>
      {isLoading && <Loader2 className="animate-spin" />}
      <AudioPlayer
        autoPlayAfterSrcChange={false}
        src={data?.audioUrl}
        onListen={listenCallback}
        listenInterval={10}
        onPlay={togglePlay}
        onPause={togglePlay}
      />
    </>
  );
}