import { getOrMakeAudioAndTranscription } from "@/lib/getOrMakeAudioAndTranscription";
import { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";

type TranscriptionResult = Awaited<
  Promise<ReturnType<typeof getOrMakeAudioAndTranscription>> | { error: string }
>;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
  // Specifies the maximum allowed duration for this function to execute (in seconds)
  maxDuration: 15,
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TranscriptionResult>
) {
  if (req.method === "POST") {
    const body = JSON.parse(req.body);
    if (!req.body || typeof body.content !== "string") {
        res.status(StatusCodes.BAD_REQUEST).end();
        return;
    }
    const content = body.content;
    const result = await getOrMakeAudioAndTranscription(content);
    res.status(StatusCodes.OK).json(result);
    return;
  }
  res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ error: "Method not allowed" });
}