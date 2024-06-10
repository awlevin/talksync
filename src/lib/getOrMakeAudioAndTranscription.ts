import { Transcription } from "@/types/audioTypes";
import { downloadAudioFile, uploadAudioAndTranscription } from "./firebase";
import { makeSpeech, makeTranscription } from "./openai";
import { getContentHash } from "./utils";

export const getOrMakeAudioAndTranscription = async (
  content: string
): Promise<{ audioUrl: string; transcription: Transcription }> => {
  const contentHash = getContentHash(content);
  let { audioUrl, transcription } = await downloadAudioFile(contentHash);
  if (!audioUrl || !transcription) {
    console.warn(
      "No audio or transcription found, creating new audio and transcription"
    );
    const audioData = await makeSpeech(content);
    transcription = await makeTranscription(audioData, content);
    const { audioUrl: audUrl, transcription: trans } =
      await uploadAudioAndTranscription({
        contentHash,
        content,
        audioData,
        transcription,
      });
    audioUrl = audUrl;
    transcription = trans;
  }

  return { audioUrl, transcription };
};