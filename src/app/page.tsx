"use client"
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { AudioWidget } from "@/components/widget";
import { CONTENT_SAMPLE } from "@/hooks";


export default function RemoteMdxPage() {

  const [currInputValue, setCurrInputValue] = useState(CONTENT_SAMPLE);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrInputValue(e.target.value);
  }

  return (
    <div className="wrapper">
      <div className="flex flex-row max-w-sm mx-auto">
        <Input onChange={handleInputChange} value={currInputValue} />
      </div>

      <div id="content-area">
        {currInputValue}
      </div>

      <AudioWidget />
    </div>
  );
}

