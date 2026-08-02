import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    phone: z.string().min(10),
    email: z.string().email("A valid email is required to receive your OTP"),
    password: z.string().min(6),    
    businessName: z.string().optional(),  
    language: z.enum(["bn", "en"]).optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    phone: z.string().min(10),
    password: z.string().min(6)
  })
});

export const otpVerifySchema = z.object({
  body: z.object({
    phone: z.string().min(10),
    otp: z.string().length(6)
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    phone: z.string().min(10)
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    phone: z.string().min(10),
    token: z.string().min(1),
    newPassword: z.string().min(6)
  })
});
