import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendSuccess } from "../../../utils/ApiResponse";
import { ApiError } from "../../../utils/ApiError";
import { MeasurementService } from "../services/measurement.service";
import { User } from "../../user/models/user.model";
import { parseVoiceTranscript } from "../utils/voiceParser";
import { formatCftLine } from "../utils/unitConversion";

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

// ---- PDF Font Setup ----
const FONT_REGULAR = path.join(__dirname, "../../../assets/fonts/HindSiliguri-Regular.ttf");
const FONT_BOLD = path.join(__dirname, "../../../assets/fonts/HindSiliguri-Bold.ttf");

// ডিবাগ লগ — ডিপ্লয় করার পর Vercel/Render লগে চেক করার জন্য
console.log("Font Regular exists:", fs.existsSync(FONT_REGULAR), "| path:", FONT_REGULAR);
console.log("Font Bold exists:", fs.existsSync(FONT_BOLD), "| path:", FONT_BOLD);

// ---- PDF Slip Generator (Clean Table Version) ----
export const downloadSlip = asyncHandler(async (req: Request, res: Response) => {
  const group: any = await MeasurementService.getById(req.user!.userId, req.params.id);
  const user = await User.findById(req.user!.userId);
  const businessName = user?.businessName || "কাঠখাতা";

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.registerFont("body", FONT_REGULAR);
  doc.registerFont("bold", FONT_BOLD);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=slip-${group.slipNumber}.pdf`);
  doc.pipe(res);

  // Business Header
  doc.font("bold").fontSize(20).fillColor("#2c8f4e").text(businessName);
  doc.font("body").fontSize(10).fillColor("#666666").text("কাঠের মাপের স্লিপ");
  doc.moveDown(0.8);

  // Meta info
  const startY = doc.y;
  doc.fontSize(10).fillColor("#333333");
  doc.text(`স্লিপ নম্বর: ${group.slipNumber}`, 40, startY);
  doc.text(`তারিখ: ${new Date(group.createdAt).toLocaleDateString("bn-BD")}`, 320, startY);
  doc.text(`গ্রাহক: ${group.customerName}`, 40, startY + 16);
  if (group.operator) doc.text(`অপারেটর: ${group.operator}`, 320, startY + 16);

  doc.y = startY + 45;
  doc.font("bold").fontSize(13).fillColor("#2c8f4e").text("মাপের বিবরণ");
  doc.moveDown(0.5);

  // Column Layout Setup
  let currentY = doc.y;
  const colX = { sl: 40, mode: 65, girth: 135, length: 220, qty: 300, cft: 350, extra: 415 };
  const colWidths = { sl: 20, mode: 65, girth: 80, length: 75, qty: 45, cft: 60, extra: 140 };

  // Table Header Line
  doc.rect(40, currentY, 515, 22).fill("#f4f8f5");
  doc.font("bold").fontSize(9).fillColor("#2c8f4e");
  doc.text("#", colX.sl + 2, currentY + 6, { width: colWidths.sl });
  doc.text("বিবরণ", colX.mode, currentY + 6, { width: colWidths.mode });
  doc.text("পরিধি (Girth)", colX.girth, currentY + 6, { width: colWidths.girth });
  doc.text("দৈর্ঘ্য (Length)", colX.length, currentY + 6, { width: colWidths.length });
  doc.text("পরিমাণ", colX.qty, currentY + 6, { width: colWidths.qty });
  doc.text("CFT", colX.cft, currentY + 6, { width: colWidths.cft });
  doc.text("ইন/পয়েন্ট", colX.extra, currentY + 6, { width: colWidths.extra });

  currentY += 24;
  doc.font("body").fontSize(9).fillColor("#222222");

  // Format Helper for Extra Column
  const cleanExtraText = (rawFormatted: string) => {
    if (!rawFormatted) return "-";
    let cleaned = rawFormatted
      .replace(/সিএফটি|CFT/gi, "")
      .replace(/ইঞ্চি/g, "in")
      .replace(/পয়েন্ট|পয়েন্ট/g, "pt")
      .replace(/ফুট/g, "ft")
      .trim();

    const match = cleaned.match(/\(([^)]+)\)/);
    return match ? match[1].trim() : cleaned;
  };

  // Render Items
  group.items.forEach((item: any, i: number) => {
    const rowHeight = 22;

    if (i % 2 === 1) {
      doc.rect(40, currentY - 3, 515, rowHeight).fill("#fcfdfe");
      doc.fillColor("#222222");
    }

    const rawFormat = formatCftLine(item.cft);
    const extraInfo = cleanExtraText(rawFormat);

    if (item.mode === "round_log") {
      doc.text(`${i + 1}`, colX.sl + 2, currentY, { width: colWidths.sl });
      doc.text("গোল কাঠ", colX.mode, currentY, { width: colWidths.mode });
      doc.text(`${item.girth} ${item.girthUnit === "inch" ? "in" : "ft"}`, colX.girth, currentY, { width: colWidths.girth });
      doc.text(`${item.length} ft`, colX.length, currentY, { width: colWidths.length });
      doc.text(`${item.quantity}টি`, colX.qty, currentY, { width: colWidths.qty });
      doc.text(`${item.cft.toFixed(2)}`, colX.cft, currentY, { width: colWidths.cft });
      doc.text(extraInfo, colX.extra, currentY, { width: colWidths.extra, height: rowHeight });
    } else {
      doc.text(`${i + 1}`, colX.sl + 2, currentY, { width: colWidths.sl });
      doc.text("সাইজ কাট", colX.mode, currentY, { width: colWidths.mode });
      doc.text(`${item.length}×${item.width} in`, colX.girth, currentY, { width: colWidths.girth });
      doc.text(`${item.thickness} in`, colX.length, currentY, { width: colWidths.length });
      doc.text(`${item.quantity}টি`, colX.qty, currentY, { width: colWidths.qty });
      doc.text(`${item.cft.toFixed(2)}`, colX.cft, currentY, { width: colWidths.cft });
      doc.text("-", colX.extra, currentY, { width: colWidths.extra });
    }

    currentY += rowHeight;
    doc.moveTo(40, currentY - 3).lineTo(555, currentY - 3).strokeColor("#f0f0f0").lineWidth(0.5).stroke();
  });

  // Check Page Overflow for Summary Section
  if (currentY > 640) {
    doc.addPage();
    currentY = 40;
  } else {
    currentY += 20;
  }

  // Summary Card (Clean Left Layout)
  const summaryX = 40;
  const summaryY = currentY;

  doc.rect(summaryX, summaryY, 240, 115).fillAndStroke("#fcfdfe", "#e2ece5");
  doc.fillColor("#000000");

  let sY = summaryY + 12;
  doc.font("bold").fontSize(10).fillColor("#222222").text("মোট CFT:", summaryX + 12, sY);
  doc.font("bold").text(`${group.totalCFT.toFixed(2)}`, summaryX + 140, sY, { align: "right", width: 85 });

  sY += 18;
  doc.font("body").fontSize(10).fillColor("#444444").text("প্রতি CFT দর:", summaryX + 12, sY);
  doc.text(`৳ ${group.ratePerCFT}`, summaryX + 140, sY, { align: "right", width: 85 });

  sY += 20;
  doc.moveTo(summaryX + 10, sY - 4).lineTo(summaryX + 230, sY - 4).strokeColor("#d5e2d8").stroke();
  doc.font("bold").fontSize(11).fillColor("#402a18").text("সর্বমোট:", summaryX + 12, sY);
  doc.text(`৳ ${group.totalPrice.toFixed(2)}`, summaryX + 120, sY, { align: "right", width: 105 });

  sY += 18;
  doc.font("body").fontSize(10).fillColor("#333333").text("পরিশোধিত:", summaryX + 12, sY);
  doc.text(`৳ ${group.paidAmount}`, summaryX + 140, sY, { align: "right", width: 85 });

  sY += 18;
  const dueColor = group.dueAmount > 0 ? "#c0392b" : "#2c8f4e";
  doc.font("bold").fontSize(10).fillColor(dueColor).text("বকেয়া:", summaryX + 12, sY);
  doc.text(`৳ ${group.dueAmount.toFixed(2)}`, summaryX + 140, sY, { align: "right", width: 85 });

  // Right Side Signature Space
  const sigX = 390;
  const sigY = summaryY + 75;
  doc.moveTo(sigX, sigY).lineTo(sigX + 150, sigY).strokeColor("#cccccc").lineWidth(1).stroke();
  doc.font("body").fontSize(9).fillColor("#777777").text("গ্রাহক / প্রতিনিধির স্বাক্ষর", sigX, sigY + 6, { align: "center", width: 150 });

  // Footer Text
  doc.font("body").fontSize(8.5).fillColor("#888888").text("এটি একটি স্বয়ংক্রিয়ভাবে তৈরি মাপের স্লিপ — কাঠখাতা", 40, summaryY + 135, { align: "center", width: 515 });

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

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.registerFont("body", FONT_REGULAR);
  doc.registerFont("bold", FONT_BOLD);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=daily-book-${date}.pdf`);
  doc.pipe(res);

  doc.font("bold").fontSize(18).fillColor("#2c8f4e").text(businessName);
  doc.font("body").fontSize(10).fillColor("#555").text(`দৈনিক মাপের বই — ${date}`);
  doc.moveDown(1);

  records.forEach((group: any, i: number) => {
    doc.font("bold").fontSize(12).fillColor("#402a18").text(`${i + 1}. ${group.customerName}`);
    doc.font("body").fontSize(9).fillColor("#888").text(`${group.slipNumber} · ${group.status === "closed" ? "সম্পন্ন" : "চলমান"}`);

    let currentY = doc.y + 4;
    doc.font("body").fontSize(9).fillColor("#000");

    group.items.forEach((item: any, idx: number) => {
      const cftFormatted = formatCftLine(item.cft).replace(/ইঞ্চি/g, "in").replace(/পয়েন্ট/g, "pt");
      const line =
        item.mode === "round_log"
          ? `   ${idx + 1}) পরিধি ${item.girth}${item.girthUnit === "inch" ? "in" : "ft"}, দৈর্ঘ্য ${item.length}ft, ${item.quantity}টি → ${cftFormatted}`
          : `   ${idx + 1}) ${item.length}×${item.width}×${item.thickness}in, ${item.quantity}টি → ${cftFormatted}`;
      doc.text(line, 40, currentY);
      currentY += 14;
    });

    doc.font("bold").fontSize(9.5).text(`   মোট: ${group.totalCFT.toFixed(2)} CFT — ৳${group.totalPrice.toFixed(2)}`, 40, currentY);
    doc.y = currentY + 16;
  });

  doc.moveDown(1);
  doc.font("bold").fontSize(13).fillColor("#2c8f4e").text(`সর্বমোট CFT: ${grandTotalCFT.toFixed(2)}`);
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

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.registerFont("body", FONT_REGULAR);
  doc.registerFont("bold", FONT_BOLD);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=bulk-slips-${Date.now()}.pdf`);
  doc.pipe(res);

  for (let i = 0; i < ids.length; i++) {
    const group: any = await MeasurementService.getById(req.user!.userId, ids[i]);
    if (i > 0) doc.addPage();

    doc.font("bold").fontSize(18).fillColor("#2c8f4e").text(businessName);
    doc.font("body").fontSize(10).fillColor("#555").text("কাঠের মাপের স্লিপ");
    doc.moveDown(1);

    doc.fontSize(10).fillColor("#000");
    doc.text(`স্লিপ নম্বর: ${group.slipNumber}`);
    doc.text(`তারিখ: ${new Date(group.createdAt).toLocaleDateString("bn-BD")}`);
    doc.text(`গ্রাহক: ${group.customerName}`);
    if (group.operator) doc.text(`অপারেটর: ${group.operator}`);
    doc.moveDown(1);

    doc.font("bold").fontSize(12).fillColor("#2c8f4e").text("মাপের বিবরণ");
    doc.font("body").fontSize(9.5).fillColor("#000");

    group.items.forEach((item: any, idx: number) => {
      const cftFormatted = formatCftLine(item.cft).replace(/ইঞ্চি/g, "in").replace(/পয়েন্ট/g, "pt");
      if (item.mode === "round_log") {
        doc.text(
          `${idx + 1}) গোল কাঠ — পরিধি ${item.girth}${item.girthUnit === "inch" ? "in" : "ft"}, দৈর্ঘ্য ${item.length}ft, ${item.quantity}টি → ${cftFormatted}`
        );
      } else {
        doc.text(
          `${idx + 1}) সাইজ কাট — ${item.length}×${item.width}×${item.thickness}in, ${item.quantity}টি → ${cftFormatted}`
        );
      }
    });

    doc.moveDown(1);
    doc.font("bold").fontSize(11).text(`মোট CFT: ${group.totalCFT.toFixed(2)}`);
    doc.font("body").fontSize(10);
    doc.text(`প্রতি CFT দর: ৳${group.ratePerCFT}`);
    doc.font("bold").fontSize(12).fillColor("#402a18").text(`সর্বমোট: ৳${group.totalPrice.toFixed(2)}`);
    doc.font("body").fontSize(10).fillColor("#000");
    doc.text(`পরিশোধিত: ৳${group.paidAmount}`);
    doc.fillColor(group.dueAmount > 0 ? "#c0392b" : "#2c8f4e").text(`বকেয়া: ৳${group.dueAmount.toFixed(2)}`);
  }

  doc.end();
});

export const parseVoice = asyncHandler(async (req: Request, res: Response) => {
  const { transcript } = req.body as { transcript: string };
  if (!transcript || !transcript.trim()) {
    throw new ApiError(400, "Transcript is required");
  }
  const result = parseVoiceTranscript(transcript);
  return sendSuccess(res, 200, "Transcript parsed", result);
});