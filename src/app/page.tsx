import TextToSpeechComponent from "@/components/textToSpeechComponent";
import { getOrMakeAudioAndTranscription } from '@/lib/getOrMakeAudioAndTranscription';
 
const md = `This is the simplest example, hope you enjoy!`;
 
export default async function RemoteMdxPage() {

  // hash the content, look it up in storage, create it if it doesnt exist
  const { audioUrl, transcription } = await getOrMakeAudioAndTranscription(md);
  
  // const audioData = await fs.promises.readFile("./audioFiles/files/wonderful-day.mp3");

  // MDX text - can be from a local file, database, CMS, fetch, anywhere...
  // const components = useMDXComponents();

  return (
    <div className="wrapper">
      {/* <MDXRemote source={md} components={components} /> */}
      <TextToSpeechComponent
        content={md}
        audioUrl={audioUrl}
        transcription={transcription}
      />
    </div>
  );
}

