import { TranscriptionResponse } from '@/types/audioTypes';
import useSWR from 'swr';
import { useEffect, useState } from 'react';

export const CONTENT_SAMPLE = "The historical thinking skill of contextualization involves having students place an event in its proper historical context. To demonstrate this historical thinking skill, students should be able to understand an event or document in relation to what else was happening at the same time or within the same time period. It is a difficult skill because students actually have to explain what was going on during the period, and they should be able to identify key people and events.";

const fetcher = async ([url, content]: [string, string]): Promise<TranscriptionResponse> => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(`Transcription request failed: ${res.status}`);
  return res.json();
};

const useDebounced = <T,>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
};

export const useTranscription = (content: string) => {
  const debounced = useDebounced(content.trim(), 600);
  const { data, error, isLoading } = useSWR<TranscriptionResponse>(
    debounced ? ["/api/transcription", debounced] : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 60_000 },
  );
  return { data, error, isLoading };
};
