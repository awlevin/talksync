import { Transcription } from "@/types/audioTypes";
import { cacheAudio, getCachedAudio } from "./storage";
import { makeSpeech, makeTranscription } from "./openai";
import { getContentHash } from "./utils";

export const getOrMakeAudioAndTranscription = async (
  content: string,
): Promise<{ audioUrl: string; transcription: Transcription }> => {
  const contentHash = getContentHash(content);
  const cached = await getCachedAudio(contentHash);
  if (cached) return cached;

  console.log("cache miss, generating audio + transcription");
  const audioData = await makeSpeech(content);
  const transcription = await makeTranscription(audioData);
  return cacheAudio({ contentHash, audioData, transcription });
};
