import { Request, Response } from "express";
import path from "path";
import PDFDocument from "pdfkit";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendSuccess } from "../../../utils/ApiResponse";
import { PurchaseService } from "../services/purchase.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const purchase = await PurchaseService.createPurchase(req.user!.userId, req.body);
  return sendSuccess(res, 201, "ক্রয় সফলভাবে যোগ হয়েছে", purchase);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { supplier, from, to } = req.query as { supplier?: string; from?: string; to?: string };
  const purchases = await PurchaseService.getAllPurchases(req.user!.userId, { supplier, from, to });
  return sendSuccess(res, 200, "ক্রয় তালিকা", purchases);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const purchase = await PurchaseService.getPurchaseById(req.user!.userId, req.params.id);
  return sendSuccess(res, 200, "ক্রয় বিবরণ", purchase);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const purchase = await PurchaseService.updatePurchase(req.user!.userId, req.params.id, req.body);
  return sendSuccess(res, 200, "আপডেট হয়েছে", purchase);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await PurchaseService.deletePurchase(req.user!.userId, req.params.id);
  return sendSuccess(res, 200, "মুছে ফেলা হয়েছে");
});

const FONT_REGULAR = path.join(__dirname, "../../../assets/fonts/HindSiliguri-Regular.ttf");
const FONT_BOLD = path.join(__dirname, "../../../assets/fonts/HindSiliguri-Bold.ttf");
const LOGO_PATH = path.join(__dirname, "../../../assets/logo.png");

export const downloadInvoice = asyncHandler(async (req: Request, res: Response) => {
  const purchase = await PurchaseService.getPurchaseById(req.user!.userId, req.params.id);
  const supplier = purchase.supplier as any; // populated

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${purchase._id}.pdf`);

  const doc = new PDFDocument({ size: "A4", margin: 50 });

  // Embed a Bengali-capable font so the invoice renders correctly
  // instead of garbled characters (pdfkit's default font has no Bengali glyphs).
  doc.registerFont("body", FONT_REGULAR);
  doc.registerFont("bold", FONT_BOLD);
  doc.font("body");

  doc.pipe(res);

  // লোগো হেডারে বসানো (ফাইল না থাকলে চুপচাপ স্কিপ করবে, PDF ভাঙবে না)
  try {
    doc.image(LOGO_PATH, 50, 45, { width: 50 });   
  } catch {
    // লোগো ফাইল না পাওয়া গেলে উপেক্ষা করা হচ্ছে
  }

  doc.y = 110; // লোগোর জায়গা ছেড়ে শিরোনাম শুরু

  doc.font("bold").fontSize(20).text("ক্রয় চালান / Purchase Invoice", { align: "center" });
  doc.font("body").moveDown();
  doc.fontSize(10).text(`চালান নম্বর: ${purchase.invoiceNumber ?? purchase._id}`);
  doc.text(`তারিখ: ${new Date(purchase.purchaseDate).toLocaleDateString("en-GB")}`);
  doc.moveDown();

  doc.font("bold").fontSize(12).text("সরবরাহকারীর তথ্য", { underline: true });
  doc.font("body").fontSize(10).text(`নাম: ${supplier?.name ?? "-"}`);
  if (supplier?.phone) doc.text(`ফোন: ${supplier.phone}`);
  if (supplier?.address) doc.text(`ঠিকানা: ${supplier.address}`);
  doc.moveDown();

  doc.font("bold").fontSize(12).text("কাঠের বিবরণ", { underline: true });
  doc.font("body").fontSize(10);
  doc.text(`কাঠের ধরন: ${purchase.woodType}`);
  doc.text(`মোট CFT: ${purchase.totalCFT.toFixed(2)}`);
  doc.moveDown();

  doc.font("bold").fontSize(12).text("খরচের হিসাব", { underline: true });
  doc.font("body").fontSize(10);
  doc.text(`কাঠের মূল্য: ৳${purchase.purchasePrice.toLocaleString()}`);
  doc.text(`পরিবহন খরচ: ৳${purchase.transportCost.toLocaleString()}`);
  doc.text(`লোডিং খরচ: ৳${purchase.loadingCost.toLocaleString()}`);
  doc.text(`আনলোডিং খরচ: ৳${purchase.unloadingCost.toLocaleString()}`);
  doc.text(`অন্যান্য খরচ: ৳${purchase.otherExpenses.toLocaleString()}`);
  doc.moveDown(0.5);
  doc.font("bold").fontSize(12).text(`সর্বমোট: ৳${purchase.grandTotal.toLocaleString()}`);
  doc.font("body").fontSize(10).text(`পরিশোধিত: ৳${purchase.paidAmount.toLocaleString()}`);
  doc
    .fillColor(purchase.dueAmount > 0 ? "red" : "green")
    .text(`বকেয়া: ৳${purchase.dueAmount.toLocaleString()}`)
    .fillColor("black");

  if (purchase.notes) {
    doc.moveDown();
    doc.fontSize(10).text(`মন্তব্য: ${purchase.notes}`);
  }

  doc.moveDown(2);
  doc.fontSize(8).fillColor("gray").text("এটি একটি স্বয়ংক্রিয়ভাবে তৈরি চালান।", { align: "center" });

  doc.end();
});