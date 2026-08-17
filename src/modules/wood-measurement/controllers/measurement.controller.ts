import { Request, Response } from "express";
import path from "path";
import PDFDocument from "pdfkit";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendSuccess } from "../../../utils/ApiResponse";
import { ApiError } from "../../../utils/ApiError";
import { MeasurementService } from "../services/measurement.service";
import { User } from "../../user/models/user.model";
import { parseVoiceTranscript } from "../utils/voiceParser";

// ---- Rules ----
export const listRules = asyncHandler(async (req: Request, res: Response) => {
  const rules = await MeasurementService.listRules(req.user!.userId);
  return sendSuccess(res, 200, "Rules fetched", rules);
});

export const createRule = asyncHandler(async (req: Request, res: Response) => {
  const rule = await MeasurementService.createRule(req.user!.userId, req.body);
  return sendSuccess(res, 201, "Rule created", rule);
});

export const updateRule = asyncHandler(async (req: Request, res: Response) => {
  const rule = await MeasurementService.updateRule(req.user!.userId, req.params.id, req.body);
  return sendSuccess(res, 200, "Rule updated", rule);
});

// ---- Notebook groups ----
export const startGroup = asyncHandler(async (req: Request, res: Response) => {
  const { customerName, operator, ratePerCFT } = req.body;
  const group = await MeasurementService.startOrGetOpenGroup(
    req.user!.userId,
    customerName,
    operator,
    ratePerCFT
  );
  return sendSuccess(res, 201, "Measurement group ready", group);
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const group = await MeasurementService.addItem(req.user!.userId, req.params.groupId, req.body);
  return sendSuccess(res, 200, "Item added", group);
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const group = await MeasurementService.removeItem(req.user!.userId, req.params.groupId, req.params.itemId);
  return sendSuccess(res, 200, "Item removed", group);
});

export const closeGroup = asyncHandler(async (req: Request, res: Response) => {
  const { ratePerCFT, paidAmount } = req.body;
  const group = await MeasurementService.close(req.user!.userId, req.params.groupId, ratePerCFT, paidAmount);
  return sendSuccess(res, 200, "Measurement closed", group);
});

export const reopenGroup = asyncHandler(async (req: Request, res: Response) => {
  const group = await MeasurementService.reopen(req.user!.userId, req.params.groupId);
  return sendSuccess(res, 200, "Measurement reopened", group);
});

export const listOpenGroups = asyncHandler(async (req: Request, res: Response) => {
  const groups = await MeasurementService.listOpenGroups(req.user!.userId);
  return sendSuccess(res, 200, "Open groups fetched", groups);
});

export const history = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search } = req.query;
  const { items, meta } = await MeasurementService.history(
    req.user!.userId,
    page ? Number(page) : undefined,
    limit ? Number(limit) : undefined,
    search as string
  );
  return sendSuccess(res, 200, "Measurement history fetched", items, meta);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const group = await MeasurementService.getById(req.user!.userId, req.params.id);
  return sendSuccess(res, 200, "Measurement fetched", group);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await MeasurementService.remove(req.user!.userId, req.params.id);
  return sendSuccess(res, 200, "Measurement deleted");
});

// ---- PDF slip ----
const FONT_REGULAR = path.join(__dirname, "../../../assets/fonts/HindSiliguri-Regular.ttf");
const FONT_BOLD = path.join(__dirname, "../../../assets/fonts/HindSiliguri-Bold.ttf");

export const downloadSlip = asyncHandler(async (req: Request, res: Response) => {
  const group: any = await MeasurementService.getById(req.user!.userId, req.params.id);
  const user = await User.findById(req.user!.userId);
  const businessName = user?.businessName || "কাঠখাতা";

  const doc = new PDFDocument({ margin: 50 });
  doc.registerFont("body", FONT_REGULAR);
  doc.registerFont("bold", FONT_BOLD);
  doc.font("body");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=slip-${group.slipNumber}.pdf`);
  doc.pipe(res);

  doc.font("bold").fontSize(18).fillColor("#2c8f4e").text(businessName);
  doc.font("body").fontSize(10).fillColor("#555").text("কাঠের মাপের স্লিপ");
  doc.moveDown(1);

  doc.fontSize(11).fillColor("#000");
  doc.text(`স্লিপ নম্বর: ${group.slipNumber}`);
  doc.text(`তারিখ: ${new Date(group.createdAt).toLocaleDateString("bn-BD")}`);
  doc.text(`গ্রাহক: ${group.customerName}`);
  if (group.operator) doc.text(`অপারেটর: ${group.operator}`);
  doc.moveDown(1);

  doc.font("bold").fontSize(12).fillColor("#2c8f4e").text("মাপের বিবরণ");
  doc.font("body").fontSize(10).fillColor("#000");
  group.items.forEach((item: any, i: number) => {
    if (item.mode === "round_log") {
      doc.text(
        `${i + 1}) গোল কাঠ — পরিধি ${item.girth} ${item.girthUnit === "inch" ? "ইঞ্চি" : "ফুট"}, দৈর্ঘ্য ${item.length} ফুট, ${item.quantity}টি → ${item.cft.toFixed(2)} সিএফটি`
      );
    } else {
      doc.text(
        `${i + 1}) সাইজ কাট — ${item.length}×${item.width}×${item.thickness} ইঞ্চি, ${item.quantity}টি → ${item.cft.toFixed(2)} সিএফটি`
      );
    }
  });

  doc.moveDown(1);
  doc.font("bold").fontSize(12).text(`মোট সিএফটি: ${group.totalCFT.toFixed(2)}`);
  doc.font("body").fontSize(11);
  doc.text(`প্রতি সিএফটি দর: ৳${group.ratePerCFT}`);
  doc.font("bold").fontSize(13).fillColor("#402a18").text(`সর্বমোট: ৳${group.totalPrice.toFixed(2)}`);
  doc.font("body").fontSize(11).fillColor("#000");
  doc.text(`পরিশোধিত: ৳${group.paidAmount}`);
  doc.fillColor(group.dueAmount > 0 ? "#c0392b" : "#2c8f4e").text(`বকেয়া: ৳${group.dueAmount.toFixed(2)}`);

  doc.moveDown(2);
  doc.fillColor("#888").fontSize(9).text("এটি একটি স্বয়ংক্রিয়ভাবে তৈরি মাপের স্লিপ — কাঠখাতা", { align: "center" });

  doc.end();
});
export const dailyBook = asyncHandler(async (req: Request, res: Response) => {
  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
  const data = await MeasurementService.dailyBook(req.user!.userId, date);
  return sendSuccess(res, 200, "Daily book fetched", data);
});

export const downloadDailyBook = asyncHandler(async (req: Request, res: Response) => {
  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
  const { records, grandTotalCFT, grandTotalPrice } = await MeasurementService.dailyBook(req.user!.userId, date);
  const user = await User.findById(req.user!.userId);
  const businessName = user?.businessName || "কাঠখাতা";

  const doc = new PDFDocument({ margin: 50 });
  doc.registerFont("body", FONT_REGULAR);
  doc.registerFont("bold", FONT_BOLD);
  doc.font("body");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=daily-book-${date}.pdf`);
  doc.pipe(res);

  doc.font("bold").fontSize(18).fillColor("#2c8f4e").text(businessName);
  doc.font("body").fontSize(10).fillColor("#555").text(`দৈনিক মাপের বই — ${date}`);
  doc.moveDown(1);

  records.forEach((group: any, i: number) => {
    doc.font("bold").fontSize(13).fillColor("#402a18").text(`${i + 1}. ${group.customerName}`);
    doc.font("body").fontSize(9).fillColor("#888").text(`${group.slipNumber} · ${group.status === "closed" ? "সম্পন্ন" : "চলমান"}`);
    doc.fontSize(10).fillColor("#000");
    group.items.forEach((item: any, idx: number) => {
      const line =
        item.mode === "round_log"
          ? `   ${idx + 1}) পরিধি ${item.girth}${item.girthUnit === "inch" ? "in" : "ft"}, দৈর্ঘ্য ${item.length}ft, ${item.quantity}টি → ${item.cft.toFixed(2)} সিএফটি`
          : `   ${idx + 1}) ${item.length}×${item.width}×${item.thickness}in, ${item.quantity}টি → ${item.cft.toFixed(2)} সিএফটি`;
      doc.text(line);
    });
    doc.font("bold").fontSize(10).text(`   মোট: ${group.totalCFT.toFixed(2)} সিএফটি — ৳${group.totalPrice.toFixed(2)}`);
    doc.moveDown(0.8);
  });

  doc.moveDown(1);
  doc.font("bold").fontSize(14).fillColor("#2c8f4e").text(`সর্বমোট সিএফটি: ${grandTotalCFT.toFixed(2)}`);
  doc.text(`সর্বমোট মূল্য: ৳${grandTotalPrice.toFixed(2)}`);

  if (records.length === 0) {
    doc.font("body").fontSize(11).fillColor("#888").text("এই দিনে কোনো হিসাব পাওয়া যায়নি।");
  }

  doc.end();
});

export const bulkPdf = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as { ids: string[] };
  if (!ids || ids.length === 0) {
    throw new ApiError(400, "No measurements selected");
  }

  const user = await User.findById(req.user!.userId);
  const businessName = user?.businessName || "কাঠখাতা";

  const doc = new PDFDocument({ margin: 50 });
  doc.registerFont("body", FONT_REGULAR);
  doc.registerFont("bold", FONT_BOLD);
  doc.font("body");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=bulk-slips-${Date.now()}.pdf`);
  doc.pipe(res);

  for (let i = 0; i < ids.length; i++) {
    const group: any = await MeasurementService.getById(req.user!.userId, ids[i]);
    if (i > 0) doc.addPage();

    doc.font("bold").fontSize(18).fillColor("#2c8f4e").text(businessName);
    doc.font("body").fontSize(10).fillColor("#555").text("কাঠের মাপের স্লিপ");
    doc.moveDown(1);

    doc.fontSize(11).fillColor("#000");
    doc.text(`স্লিপ নম্বর: ${group.slipNumber}`);
    doc.text(`তারিখ: ${new Date(group.createdAt).toLocaleDateString("bn-BD")}`);
    doc.text(`গ্রাহক: ${group.customerName}`);
    if (group.operator) doc.text(`অপারেটর: ${group.operator}`);
    doc.moveDown(1);

    doc.font("bold").fontSize(12).fillColor("#2c8f4e").text("মাপের বিবরণ");
    doc.font("body").fontSize(10).fillColor("#000");
    group.items.forEach((item: any, idx: number) => {
      if (item.mode === "round_log") {
        doc.text(
          `${idx + 1}) গোল কাঠ — পরিধি ${item.girth} ${item.girthUnit === "inch" ? "ইঞ্চি" : "ফুট"}, দৈর্ঘ্য ${item.length} ফুট, ${item.quantity}টি → ${item.cft.toFixed(2)} সিএফটি`
        );
      } else {
        doc.text(
          `${idx + 1}) সাইজ কাট — ${item.length}×${item.width}×${item.thickness} ইঞ্চি, ${item.quantity}টি → ${item.cft.toFixed(2)} সিএফটি`
        );
      }
    });

    doc.moveDown(1);
    doc.font("bold").fontSize(12).text(`মোট সিএফটি: ${group.totalCFT.toFixed(2)}`);
    doc.font("body").fontSize(11);
    doc.text(`প্রতি সিএফটি দর: ৳${group.ratePerCFT}`);
    doc.font("bold").fontSize(13).fillColor("#402a18").text(`সর্বমোট: ৳${group.totalPrice.toFixed(2)}`);
    doc.font("body").fontSize(11).fillColor("#000");
    doc.text(`পরিশোধিত: ৳${group.paidAmount}`);
    doc.fillColor(group.dueAmount > 0 ? "#c0392b" : "#2c8f4e").text(`বকেয়া: ৳${group.dueAmount.toFixed(2)}`);
  }

  doc.end();
});
// ---- Voice/text parsing (AI's ONLY job: extract structured data, never calculate) ----
export const parseVoice = asyncHandler(async (req: Request, res: Response) => {
  const { transcript } = req.body as { transcript: string };
  if (!transcript || !transcript.trim()) {
    throw new ApiError(400, "Transcript is required");
  }
  const result = parseVoiceTranscript(transcript);
  return sendSuccess(res, 200, "Transcript parsed", result);
});