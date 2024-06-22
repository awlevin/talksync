import { TranscriptionResponse } from '@/types/audioTypes';
import useSWRMutation from 'swr/mutation';
import { useListenForContentChanges } from './useListenForContentChanges';
import { useEffect } from 'react';

export const CONTENT_SAMPLE = "The historical thinking skill of contextualization involves having students place an event in its proper historical context. To demonstrate this historical thinking skill, students should be able to understand an event or document in relation to what else was happening at the same time or within the same time period. It is a difficult skill because students actually have to explain what was going on during the period, and they should be able to identify key people and events." 

const fetcher = async (url: string, { arg }: { arg: string }) => {
  console.log({ arg })
  return fetch(url, {
    method: "POST",
    body: JSON.stringify({ content: CONTENT_SAMPLE }),
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
