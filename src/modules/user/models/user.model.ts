import { Schema, model, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  password: string;
  role: "mill_owner" | "admin";
  businessName?: string;
  avatarUrl?: string;
  language: "bn" | "en";
  isVerified: boolean;
  otp?: string;
  otpExpiresAt?: Date;
  passwordResetToken?: string;
  passwordResetExpiresAt?: Date;
  refreshTokens: string[];
  comparePassword(candidate: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["mill_owner", "admin"], default: "mill_owner" },
    businessName: { type: String, trim: true },
    avatarUrl: { type: String },
    language: { type: String, enum: ["bn", "en"], default: "bn" },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    refreshTokens: { type: [String], default: [], select: false }
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser>("User", userSchema);
