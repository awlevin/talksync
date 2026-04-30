export type Word = {
  text: string;
  startSecond: number;
  endSecond: number;
};

export type Transcription = {
  text: string;
  language: string | undefined;
  durationInSeconds: number | undefined;
  words: Word[];
};

export type TranscriptionResponse = {
  audioUrl: string;
  transcription: Transcription;
};
