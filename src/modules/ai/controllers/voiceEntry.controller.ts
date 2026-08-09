import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendSuccess } from "../../../utils/ApiResponse";
import { parseVoiceEntry } from "../services/voiceEntry.service";

export const voiceParse = asyncHandler(async (req: Request, res: Response) => {
  const { text, language, fields } = req.body;
  const result = await parseVoiceEntry(text, fields, language);
  return sendSuccess(res, 200, "বিশ্লেষণ সম্পন্ন হয়েছে", result);
});