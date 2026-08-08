import { BusinessSettings, IBusinessSettings } from "../models/settings.model";
import type { UpdateSettingsInput } from "../validators/settings.validator";

export class SettingsService {
  /**
   * ওই owner-এর settings থাকলে ফেরত দেয়, না থাকলে ডিফল্ট মান দিয়ে নতুন তৈরি করে দেয়।
   */
  static async getOrCreate(ownerId: string): Promise<IBusinessSettings> {
    let settings = await BusinessSettings.findOne({ owner: ownerId });
    if (!settings) {
      settings = await BusinessSettings.create({ owner: ownerId });
    }
    return settings;
  }

  static async update(ownerId: string, input: UpdateSettingsInput): Promise<IBusinessSettings> {
    let settings = await BusinessSettings.findOne({ owner: ownerId });
    if (!settings) {
      settings = new BusinessSettings({ owner: ownerId });
    }
    Object.assign(settings, input);
    await settings.save();
    return settings;
  }
}