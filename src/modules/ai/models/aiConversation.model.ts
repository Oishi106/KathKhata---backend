import { Schema, model, Document, Types } from "mongoose";

interface IMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface IAIConversation extends Document {
  owner: Types.ObjectId;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const aiConversationSchema = new Schema<IAIConversation>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New conversation" },
    messages: { type: [messageSchema], default: [] }
  },
  { timestamps: true }
);

export const AIConversation = model<IAIConversation>("AIConversation", aiConversationSchema);
