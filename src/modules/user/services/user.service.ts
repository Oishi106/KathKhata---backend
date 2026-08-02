import { User } from "../models/user.model";
import { ApiError } from "../../../utils/ApiError";

export const UserService = {
  async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("User not found");
    return user;
  },

  async updateProfile(userId: string, data: Record<string, unknown>) {
    const allowed = ["name", "email", "businessName", "avatarUrl", "language"];
    const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));

    const user = await User.findByIdAndUpdate(userId, filtered, { new: true, runValidators: true });
    if (!user) throw ApiError.notFound("User not found");
    return user;
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId).select("+password +refreshTokens");
    if (!user) throw ApiError.notFound("User not found");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw ApiError.badRequest("Current password is incorrect");

    user.password = newPassword;
    user.refreshTokens = [];
    await user.save();
    return { changed: true };
  }
};
