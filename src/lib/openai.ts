import {
  experimental_generateSpeech as generateSpeech,
  experimental_transcribe as transcribe,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { Transcription } from "@/types/audioTypes";

export const makeSpeech = async (content: string): Promise<ArrayBuffer> => {
  const { audio } = await generateSpeech({
    model: openai.speech("tts-1-hd"),
    text: content,
    voice: "nova",
  });
  const bytes = audio.uint8Array;
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
};

export const makeTranscription = async (
  audioData: ArrayBuffer
): Promise<Transcription> => {
  const result = await transcribe({
    model: openai.transcription("whisper-1"),
    audio: new Uint8Array(audioData),
    providerOptions: {
      openai: {
        timestampGranularities: ["word"],
        language: "en",
        temperature: 0.5,
        prompt: "Don't stop transcribing early please!",
      },
    },
  });

  return {
    text: result.text,
    language: result.language,
    durationInSeconds: result.durationInSeconds,
    words: result.segments.map((s) => ({
      text: s.text,
      startSecond: s.startSecond,
      endSecond: s.endSecond,
    })),
  };
};
