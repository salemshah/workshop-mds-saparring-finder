import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long' }),
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long' }),
});

export const verifyEmailSchema = z.object({
  code: z
    .string()
    .length(6, { message: 'Verification code must be 6 characters long' }),
});

export const resendVerificationSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

export const resetPasswordSchema = z.object({
  code: z
    .string()
    .length(6, { message: 'Reset code must be 6 characters long' }),
  newPassword: z
    .string()
    .min(6, { message: 'New password must be at least 6 characters long' }),
});
