import crypto from "crypto";
import { User } from "../../user/models/user.model";
import { ApiError } from "../../../utils/ApiError";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../../utils/jwt";
import { sendOtpEmail } from "../../../utils/mailer";

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const AuthService = {
  async register(input: {
    name: string;
    phone: string;
    email: string;
    password: string;
    businessName?: string;
    language?: "bn" | "en";
  }) {
    const existing = await User.findOne({ phone: input.phone });
    if (existing) throw ApiError.conflict("Phone number already registered");

    const user = await User.create(input);

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(user.email!, otp);

    return { userId: user._id, otpSentTo: user.email };
  },

  async verifyOtp(phone: string, otp: string) {
    const user = await User.findOne({ phone }).select("+otp +otpExpiresAt");
    if (!user || !user.otp || !user.otpExpiresAt) throw ApiError.badRequest("Invalid OTP request");
    if (user.otp !== otp || user.otpExpiresAt < new Date()) {
      throw ApiError.badRequest("Invalid or expired OTP");
    }
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();
    return { verified: true };
  },

  async login(phone: string, password: string) {
    const user = await User.findOne({ phone }).select("+password +refreshTokens");
    if (!user) throw ApiError.unauthorized("Invalid phone number or password");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw ApiError.unauthorized("Invalid phone number or password");

    if (!user.isVerified) throw ApiError.forbidden("Please verify your phone number via OTP first");

    const payload = { userId: user._id.toString(), role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refreshTokens.push(refreshToken);
    await user.save();

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        businessName: user.businessName,
        language: user.language
      }
    };
  },

  async refresh(token: string) {
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.userId).select("+refreshTokens");
    if (!user || !user.refreshTokens.includes(token)) {
      throw ApiError.unauthorized("Invalid refresh token");
    }
    const payload = { userId: user._id.toString(), role: user.role };
    const accessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(userId: string, token: string) {
    const user = await User.findById(userId).select("+refreshTokens");
    if (!user) return;
    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
    await user.save();
  },

  async forgotPassword(phone: string) {
    const user = await User.findOne({ phone });
    if (!user) throw ApiError.notFound("No account found with this phone number");

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await sendOtpEmail(user.email!, resetToken);

    return { resetToken };
  },

  async resetPassword(phone: string, token: string, newPassword: string) {
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      phone,
      passwordResetToken: hashed,
      passwordResetExpiresAt: { $gt: new Date() }
    }).select("+passwordResetToken +passwordResetExpiresAt");

    if (!user) throw ApiError.badRequest("Invalid or expired reset token");

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    user.refreshTokens = [];
    await user.save();

    return { reset: true };
  }
};