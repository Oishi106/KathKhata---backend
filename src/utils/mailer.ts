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

// লোগো পাবলিক ফোল্ডারে হোস্ট করা থাকলে সেই URL এখানে বসবে (Step 3-এ ঠিক করা হবে)
const LOGO_URL = "https://kathkhata.ai/logo.png";

const socialLinks = {
  facebook: "https://www.facebook.com/mahmudaafroz.oishi",
  linkedin: "https://www.linkedin.com/in/mahmuda-afroz-/",
  github: "https://github.com/Oishi106",
  portfolio: "https://mahamuda-afroz-portfolio.vercel.app/"
};

function emailWrapper(bodyHtml: string): string {
  return `
  <div style="background-color: #f7f3ea; padding: 40px 16px; font-family: 'Segoe UI', Arial, sans-serif;">
    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(64, 42, 24, 0.08);">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #2c8f4e 0%, #1f6e3a 100%); padding: 32px 24px; text-align: center;">
        <img src="${LOGO_URL}" alt="কাঠখাতা এআই" width="64" height="64" style="border-radius: 50%; background: #fff; padding: 6px;" />
        <h1 style="color: #ffffff; font-size: 22px; margin: 12px 0 0; font-weight: 700;">কাঠখাতা এআই</h1>
        <p style="color: #d8f0e0; font-size: 13px; margin: 4px 0 0;">KathKhata AI — Your Sawmill's Digital Ledger</p>
      </div>

      <!-- Body -->
      <div style="padding: 32px 28px;">
        ${bodyHtml}
      </div>

      <!-- Footer -->
      <div style="background: #faf7f0; padding: 24px 28px; border-top: 1px solid #f0e5d0;">
        <p style="color: #8a7a5c; font-size: 12px; margin: 0 0 12px; text-align: center;">
          Developer of কাঠখাতা — Mahmuda Afroz Oishi
        </p>
        <div style="text-align: center;">
          <a href="${socialLinks.facebook}" style="display: inline-block; margin: 0 8px; text-decoration: none; color: #2c8f4e; font-size: 12px; font-weight: 600;">Facebook</a>
          <span style="color: #d8cdb0;">•</span>
          <a href="${socialLinks.linkedin}" style="display: inline-block; margin: 0 8px; text-decoration: none; color: #2c8f4e; font-size: 12px; font-weight: 600;">LinkedIn</a>
          <span style="color: #d8cdb0;">•</span>
          <a href="${socialLinks.github}" style="display: inline-block; margin: 0 8px; text-decoration: none; color: #2c8f4e; font-size: 12px; font-weight: 600;">GitHub</a>
          <span style="color: #d8cdb0;">•</span>
          <a href="${socialLinks.portfolio}" style="display: inline-block; margin: 0 8px; text-decoration: none; color: #2c8f4e; font-size: 12px; font-weight: 600;">Portfolio</a>
        </div>
      </div>

    </div>
  </div>
  `;
}

export const sendOtpEmail = async (to: string, otp: string) => {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    logger.warn(`SMTP not configured — OTP for ${to} is ${otp} (dev fallback, check console)`);
    return;
  }

  const body = `
    <p style="color: #402a18; font-size: 15px; margin: 0 0 8px;">আপনার যাচাইকরণ কোড (Verification code):</p>
    <div style="background: #f7f3ea; border-radius: 12px; padding: 20px; text-align: center; margin: 16px 0;">
      <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #2c8f4e;">${otp}</span>
    </div>
    <p style="color: #a89878; font-size: 13px; margin: 0;">এই কোডটি ১০ মিনিটের জন্য বৈধ। This code is valid for 10 minutes.</p>
    <p style="color: #c4b89a; font-size: 12px; margin: 16px 0 0;">
      আপনি যদি এই কোড অনুরোধ না করে থাকেন, এই ইমেইলটি উপেক্ষা করুন।
    </p>
  `;

  try {
    await transporter.sendMail({
      from: env.MAIL_FROM || `কাঠখাতা এআই <${env.SMTP_USER}>`,
      to,
      subject: "আপনার কাঠখাতা এআই যাচাইকরণ কোড / Your KathKhata AI verification code",
      html: emailWrapper(body)
    });
    logger.info(`OTP email sent to ${to}`);
  } catch (err) {
    logger.error(`Failed to send OTP email to ${to}: ${(err as Error).message}`);
  }
};