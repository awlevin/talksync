import { storage } from "@/firebaseConfig";
import { Transcription } from "@/types/audioTypes";
import { FirebaseError } from "firebase/app";
import { ref, uploadBytes, getDownloadURL, getBytes } from "firebase/storage";

const BASE_PATH = `/contentFolders/`

export const downloadAudioFile = async (
  contentHash: string
): Promise<{ audioUrl: string | null; transcription: Transcription | null }> => {
  let audioUrl = null, transcription = null;
  try {
  [audioUrl, transcription] = await Promise.all([
    getDownloadURL(ref(storage, `${BASE_PATH}/${contentHash}/audio.mp3`)),
    getBytes(ref(storage, `${BASE_PATH}/${contentHash}/transcription.json`)).then((blob) =>
      JSON.parse(Buffer.from(blob).toString("utf-8"))
    ),
  ]);
  } catch (err) {
    switch ((err as FirebaseError).code) {
      case "storage/object-not-found":
        console.log("Firebase Error: No audio or transcription found");
        break;
      case "storage/unauthorized":
        console.error("Firebase Error: User doesn't have permission to access the object");
        break;
      case "storage/canceled":
        console.error("Firebase Error: User canceled the upload");
        break;
      default:
    }
  }

  return { audioUrl, transcription }
};

export const uploadAudioAndTranscription = async ({
  contentHash,
  content,
  audioData,
  transcription,
}: {
  contentHash: string;
  content: string;
  audioData: ArrayBuffer;
  transcription: Transcription;
}): Promise<{audioUrl: string, transcription: Transcription}> => {
  const refPath = `${BASE_PATH}/${contentHash}`;
  const audioRef = ref(storage, `${refPath}/audio.mp3`);
  const transcriptionRef = ref(storage, `${refPath}/transcription.json`);
  const originalContentRef = ref(storage, `${refPath}/content.md`);

  const encoder = new TextEncoder();
  const transcriptionBuffer = encoder.encode(JSON.stringify(transcription));
  const contentBuffer = encoder.encode(content);

  await Promise.all([
    (await uploadBytes(audioRef, audioData)).ref,
    uploadBytes(transcriptionRef, transcriptionBuffer),
    uploadBytes(originalContentRef, contentBuffer),
  ]);

  return { audioUrl: await getDownloadURL(audioRef), transcription };
};
