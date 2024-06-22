import OpenAI from "openai";
const openai = new OpenAI();

// export type Transcription = Awaited<ReturnType<typeof openai.audio.transcriptions.create>>;
export type Transcription = {
  task: string
  language: string
  duration: number
  text: string
  words: Word[]
}

export type Word = {
  word: string
  start: number
  end: number
}

export type TranscriptionResponse = {
  audioUrl: string;
  transcription: Transcription;
};

