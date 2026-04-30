import { head, put } from "@vercel/blob";
import { Transcription } from "@/types/audioTypes";

const audioPath = (hash: string) => `content/${hash}/audio.mp3`;
const transcriptionPath = (hash: string) => `content/${hash}/transcription.json`;

export const getCachedAudio = async (
  contentHash: string,
): Promise<{ audioUrl: string; transcription: Transcription } | null> => {
  try {
    const audioInfo = await head(audioPath(contentHash));
    const transcriptionInfo = await head(transcriptionPath(contentHash));
    const transcription: Transcription = await fetch(transcriptionInfo.url).then((r) => r.json());
    return { audioUrl: audioInfo.url, transcription };
  } catch {
    return null;
  }
};

export const cacheAudio = async ({
  contentHash,
  audioData,
  transcription,
}: {
  contentHash: string;
  audioData: ArrayBuffer;
  transcription: Transcription;
}): Promise<{ audioUrl: string; transcription: Transcription }> => {
  const [audioBlob] = await Promise.all([
    put(audioPath(contentHash), audioData, {
      access: "public",
      contentType: "audio/mpeg",
      addRandomSuffix: false,
      allowOverwrite: true,
    }),
    put(transcriptionPath(contentHash), JSON.stringify(transcription), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    }),
  ]);

  return { audioUrl: audioBlob.url, transcription };
};
