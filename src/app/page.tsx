"use client"
import TextToSpeechComponent from "@/components/textToSpeechComponent";
import { CheckIconButton, CheckIconButtonStates } from "@/components/ui/check-icon-button";
import { Input } from "@/components/ui/input";
import { getOrMakeAudioAndTranscription } from '@/lib/getOrMakeAudioAndTranscription';
import { Transcription } from "@/types/audioTypes";
import { useState } from "react";
 
export default function RemoteMdxPage() {

  const [inputValue, setInputValue] = useState("This is the simplest example, hope you enjoy!");
  const [buttonState, setButtonState] = useState<CheckIconButtonStates>("unchecked");
  const [audioData, setAudioData] = useState<{
    audioUrl: string;
    transcription: Transcription;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setButtonState("unchecked");
    setInputValue(e.target.value);
  }

  const generateAudio = async () => {
    setButtonState("loading")
    const data = await getOrMakeAudioAndTranscription(inputValue);
    console.log({data})
    setButtonState("checked");
    setAudioData(data);
  }

  return (
    <div className="wrapper">
      {/* <MDXRemote source={md} components={components} /> */}
      <div className="flex flex-row max-w-sm mx-auto">
        <Input onChange={handleInputChange} value={inputValue} />
        <CheckIconButton onClick={generateAudio} state={buttonState} disabled={buttonState === "checked"} />
      </div>
      {audioData && <TextToSpeechComponent
        content={inputValue}
        audioUrl={audioData.audioUrl}
        transcription={audioData.transcription}
      />}
    </div>
  );
}

