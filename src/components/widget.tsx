import { useTranscription } from '@/hooks';
import { Loader2 } from 'lucide-react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

export const AudioWidget = () => {

  const { data, error, isLoading } = useTranscription();

  return (
    <>
      {isLoading && <Loader2 className="animate-spin" />}
      <AudioPlayer autoPlayAfterSrcChange={false} src={data?.audioUrl} />
    </>
  );
}