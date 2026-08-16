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

// লোগো পাবলিক ফোল্ডারে হোস্ট করা থাকলে সেই URL এখানে বসবে (deploy করার পর আসল URL বসাতে হবে)
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
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
          <tr>
            <td style="background: #ffffff; border-radius: 50%; width: 64px; height: 64px; text-align: center; vertical-align: middle;">
              <img src="${LOGO_URL}" alt="কাঠখাতা" width="48" height="48" style="display: block; margin: 8px auto; border-radius: 50%;" />
            </td>
          </tr>
        </table>
        <h1 style="color: #ffffff; font-size: 22px; margin: 12px 0 0; font-weight: 700;">কাঠখাতা এআই</h1>
        <p style="color: #d8f0e0; font-size: 13px; margin: 4px 0 0;">KathKhata AI — Your Sawmill's Digital Ledger</p>
      </div>

      <!-- Body -->
      <div style="padding: 32px 28px;">
        ${bodyHtml}
      </div>

      <!-- Footer -->
      <div style="background: #faf7f0; padding: 24px 28px; border-top: 1px solid #f0e5d0;">
        <p style="color: #8a7a5c; font-size: 12px; margin: 0 0 16px; text-align: center;">
          Developer of কাঠখাতা — <strong style="color: #402a18;">Mahmuda Afroz Oishi</strong>
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
          <tr>
            <td style="padding: 0 10px; text-align: center;">
              <a href="${socialLinks.facebook}" style="text-decoration: none;">
                <img src="https://www.google.com/s2/favicons?domain=facebook.com&sz=64" width="22" height="22" alt="Facebook" style="display: block; margin: 0 auto 4px; border-radius: 4px;" />
                <span style="color: #6b5d42; font-size: 11px; font-weight: 500;">Facebook</span>
              </a>
            </td>
            <td style="padding: 0 10px; text-align: center;">
              <a href="${socialLinks.linkedin}" style="text-decoration: none;">
                <img src="https://www.google.com/s2/favicons?domain=linkedin.com&sz=64" width="22" height="22" alt="LinkedIn" style="display: block; margin: 0 auto 4px; border-radius: 4px;" />
                <span style="color: #6b5d42; font-size: 11px; font-weight: 500;">LinkedIn</span>
              </a>
            </td>
            <td style="padding: 0 10px; text-align: center;">
              <a href="${socialLinks.github}" style="text-decoration: none;">
                <img src="https://www.google.com/s2/favicons?domain=github.com&sz=64" width="22" height="22" alt="GitHub" style="display: block; margin: 0 auto 4px; border-radius: 4px;" />
                <span style="color: #6b5d42; font-size: 11px; font-weight: 500;">GitHub</span>
              </a>
            </td>
            <td style="padding: 0 10px; text-align: center;">
              <a href="${socialLinks.portfolio}" style="text-decoration: none;">
                <img src="https://www.google.com/s2/favicons?domain=vercel.app&sz=64" width="22" height="22" alt="Portfolio" style="display: block; margin: 0 auto 4px; border-radius: 4px;" />
                <span style="color: #6b5d42; font-size: 11px; font-weight: 500;">Portfolio</span>
              </a>
            </td>
          </tr>
        </table>
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