// run this file with npx tsx <path-to-file>

// load environemnt variables from .env
import dotenv from 'dotenv';
import fs from "fs";
import path from "path";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI();

const FILE_NAME = "wonderful-day";
const audioPath = path.resolve(`./audioFiles/files/${FILE_NAME}`);

async function main() {

  // get and save audio file
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: "Today is a wonderful day to build something people love!",
  });
  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(audioPath + ".mp3", buffer);

  // get and save transcriptions (to get timestamps)
  const transcriptions = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath + ".mp3"),
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["word"]
  });
  await fs.promises.writeFile(audioPath + ".json", JSON.stringify(transcriptions, null, 2));
}
main();
