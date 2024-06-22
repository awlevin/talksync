import { TranscriptionResponse } from '@/types/audioTypes';
import useSWRMutation from 'swr/mutation';
import { useListenForContentChanges } from './useListenForContentChanges';
import { useEffect } from 'react';

const fetcher = async (url: string, { arg }: { arg: string }) => {
  return fetch(url, {
    method: "POST",
    body: JSON.stringify({ content: arg }),
  }).then((res) => res.json());
};

export const useTranscription = () => {
  const content = useListenForContentChanges();
  const { data, error, isMutating, trigger } = useSWRMutation<
    TranscriptionResponse,
    Error,
    string,
    string
    >("/api/transcription", fetcher);
    

  useEffect(() => {
    if (content) {
      trigger(content);
    }
  }, [content])
  
  return {
    data,
    error,
    isLoading: isMutating,
  };
}
