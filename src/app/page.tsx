"use client"
import { useState } from "react";
import TextToSpeechComponent from "@/components/textToSpeechComponent";
import { CheckIconButton } from "@/components/ui/check-icon-button";
import { Input } from "@/components/ui/input";
import { TranscriptionResponse } from "@/types/audioTypes";
import useSwrMutation from "swr/mutation";

const fetcher = async (url: string, { arg }: { arg: string }) => {
  return fetch(url, {
    method: "POST",
    body: JSON.stringify({ content: arg }),
  }).then((res) => res.json());
};

export default function RemoteMdxPage() {

  const [currInputValue, setCurrInputValue] = useState("This is the simplest example, hope you enjoy!");
  const [finalInputValue, setFinalInputValue] = useState(currInputValue);
  const { data: audioData, error, isMutating, trigger } = useSwrMutation<
    TranscriptionResponse,
    Error,
    string,
    string
    >("/api/transcription", fetcher);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrInputValue(e.target.value);
  }

  const makeRequest = async () => {
    await trigger(currInputValue);
    setFinalInputValue(currInputValue);
  }

  const hasInputChanged = currInputValue !== finalInputValue;
  const buttonState = isMutating
    ? "loading"
    : hasInputChanged
    ? "unchecked" // clickable, fetch again
    : "checked" // done loading

  return (
    <div className="wrapper">
      {/* <MDXRemote source={md} components={components} /> */}
      <div className="flex flex-row max-w-sm mx-auto">
        <Input onChange={handleInputChange} value={currInputValue} />
        <CheckIconButton
          onClick={makeRequest}
          state={buttonState}
          disabled={["checked", "loading"].includes(buttonState)}
        />
      </div>
      {error && <p className="text-red-600">Error: {error.message}</p>}
      {audioData && (
        <TextToSpeechComponent
          content={finalInputValue}
          audioUrl={audioData.audioUrl}
          transcription={audioData.transcription}
        />
      )}
    </div>
  );
}

