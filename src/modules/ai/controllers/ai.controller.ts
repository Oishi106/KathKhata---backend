import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendSuccess } from "../../../utils/ApiResponse";
import { AIService } from "../services/ai.service";

export const listConversations = asyncHandler(async (req: Request, res: Response) => {
  const data = await AIService.listConversations(req.user!.userId);
  return sendSuccess(res, 200, "Conversations fetched", data);
});

export const getConversation = asyncHandler(async (req: Request, res: Response) => {
  const data = await AIService.getConversation(req.user!.userId, req.params.id);
  return sendSuccess(res, 200, "Conversation fetched", data);
});

export const ask = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId, message } = req.body;
  const result = await AIService.ask(req.user!.userId, conversationId, message);
  return sendSuccess(res, 200, "AI response generated", result);
});

export const quickInsights = asyncHandler(async (req: Request, res: Response) => {
  const insights = await AIService.quickInsights(req.user!.userId);
  return sendSuccess(res, 200, "Quick business insights fetched", insights);
});

export const suggestedQuestions = asyncHandler(async (req: Request, res: Response) => {
  const lang = (req.query.lang as "bn" | "en") ?? "bn";
  const questions = AIService.suggestedQuestions(lang);
  return sendSuccess(res, 200, "Suggested questions fetched", questions);
});
