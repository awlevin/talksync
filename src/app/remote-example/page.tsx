import { useMDXComponents } from '@/mdx-components';
import { MDXRemote } from 'next-mdx-remote/rsc'
import fs from "fs";
import TextToSpeechComponent from './textToSpeechComponent';
 
const md = `This is the simplest example`;
 
export default async function RemoteMdxPage() {

  // load speech.mp3
  const audioData = await fs.promises.readFile("./audioFiles/files/wonderful-day.mp3");

  // MDX text - can be from a local file, database, CMS, fetch, anywhere...
  // const components = useMDXComponents();

  return (
    <div className="wrapper">
      {/* <MDXRemote source={md} components={components} /> */}
      <TextToSpeechComponent audioData={audioData}/>
    </div>
  );
}
