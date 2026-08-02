import { Types } from "mongoose";
import { AIConversation } from "../models/aiConversation.model";
import { getAIProvider } from "./aiProviderFactory";
import { ApiError } from "../../../utils/ApiError";
import { DashboardService } from "../../dashboard/services/dashboard.service";
import { WoodInventory } from "../../wood-inventory/models/woodInventory.model";
import { User } from "../../user/models/user.model";

const buildBusinessSummary = async (owner: string) => {
  const [dash, lowStock] = await Promise.all([
    DashboardService.summary(owner),
    WoodInventory.find({ owner, status: { $in: ["low_stock", "out_of_stock"] } }).limit(5)
  ]);

  return [
    `Today's revenue: ${dash.todayRevenue}, expense: ${dash.todayExpense}, profit: ${dash.todayProfit}.`,
    `Monthly profit: ${dash.monthlyProfit}. Pending orders: ${dash.pendingOrders}, completed: ${dash.completedOrders}.`,
    `Available wood stock: ${dash.availableWoodCFT} CFT.`,
    lowStock.length
      ? `Low/out-of-stock items: ${lowStock.map((w) => w.woodType).join(", ")}.`
      : "No low-stock alerts."
  ].join(" ");
};

export const AIService = {
  async listConversations(owner: string) {
    return AIConversation.find({ owner }).sort({ updatedAt: -1 }).select("title updatedAt createdAt");
  },

  async getConversation(owner: string, id: string) {
    const convo = await AIConversation.findOne({ _id: id, owner });
    if (!convo) throw ApiError.notFound("Conversation not found");
    return convo;
  },

  async ask(owner: string, conversationId: string | undefined, message: string) {
    const user = await User.findById(owner);
    const language = user?.language ?? "bn";

    let convo = conversationId
      ? await AIConversation.findOne({ _id: conversationId, owner })
      : null;

    if (!convo) {
      convo = await AIConversation.create({
        owner: new Types.ObjectId(owner),
        title: message.slice(0, 40),
        messages: []
      });
    }

    convo.messages.push({ role: "user", content: message, createdAt: new Date() });

    const provider = getAIProvider();
    const businessSummary = await buildBusinessSummary(owner);

    const reply = await provider.generateReply(
      message,
      convo.messages.map((m) => ({ role: m.role, content: m.content })),
      { businessSummary, language }
    );

    convo.messages.push({ role: "assistant", content: reply, createdAt: new Date() });
    await convo.save();

    return { conversationId: convo._id, reply };
  },

  async quickInsights(owner: string) {
    const dash = await DashboardService.summary(owner);
    const insights: string[] = [];

    if (dash.todayProfit < 0) insights.push("Today's expenses exceeded revenue — review spending.");
    if (dash.lowStockAlerts > 0) insights.push(`${dash.lowStockAlerts} wood item(s) are low or out of stock.`);
    if (dash.pendingOrders > 5) insights.push(`You have ${dash.pendingOrders} pending cutting orders — consider prioritizing.`);
    if (dash.monthlyProfit > 0) insights.push(`Healthy monthly profit of ${dash.monthlyProfit} so far.`);

    if (insights.length === 0) insights.push("Everything looks stable today. No urgent issues detected.");

    return insights;
  },

  suggestedQuestions(language: "bn" | "en" = "bn") {
    return language === "bn"
      ? [
          "এই মাসে আমার লাভ কত হয়েছে?",
          "কোন কাঠ কম আছে?",
          "খরচ কমানোর উপায় কী?",
          "পরবর্তী মাসে বিক্রি কেমন হতে পারে?"
        ]
      : [
          "What was my profit this month?",
          "Which wood stock is running low?",
          "How can I reduce expenses?",
          "What might next month's sales look like?"
        ];
  }
};
