import dotenv from 'dotenv';
import OpenAI, { toFile } from "openai";
import { getContentHash } from './utils';
import { Transcription } from '@/types/audioTypes';

dotenv.config();

const openai = new OpenAI();

// const FILE_NAME = "wonderful-day";
// const audioPath = path.resolve(`./audioFiles/files/${FILE_NAME}`);

export const makeSpeech = async (content: string): Promise<ArrayBuffer> => {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1-hd",
    voice: "nova",
    input: content,
  });

  return mp3.arrayBuffer();
};

export const makeTranscription = async (
  audioData: ArrayBuffer,
  content: string
): Promise<Transcription> => {
  const contentHash = getContentHash(content);

  const audioFile = await toFile(Buffer.from(audioData), `${contentHash}.mp3`);
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["word"],
  });

  return transcription as Transcription; // this blows, idk how to get the right openAI type for this
};
