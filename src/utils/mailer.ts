import nodemailer from "nodemailer";
import { env } from "../config/env";
import { logger } from "./logger";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

export const sendOtpEmail = async (to: string, otp: string) => {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    logger.warn(`SMTP not configured — OTP for ${to} is ${otp} (dev fallback, check console)`);
    return;
  }

  try {
    await transporter.sendMail({
      from: env.MAIL_FROM || `KathKhata AI <${env.SMTP_USER}>`,
      to,
      subject: "আপনার কাঠখাতা এআই যাচাইকরণ কোড / Your KathKhata AI verification code",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #2c8f4e;">কাঠখাতা এআই — KathKhata AI</h2>
          <p>আপনার যাচাইকরণ কোড (Verification code):</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #402a18;">${otp}</p>
          <p style="color: #777; font-size: 13px;">এই কোডটি ১০ মিনিটের জন্য বৈধ। This code is valid for 10 minutes.</p>
        </div>
      `
    });
    logger.info(`OTP email sent to ${to}`);
  } catch (err) {
    logger.error(`Failed to send OTP email to ${to}: ${(err as Error).message}`);
  }
};