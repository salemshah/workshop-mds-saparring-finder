import { z } from 'zod';

export const updateEmailSchema = z.object({
  newEmail: z.string().email({ message: 'Invalid email address' }),
});

export const completeRegistrationSchema = z.object({
  birthDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  phoneNumber: z
    .string()
    .min(10, { message: 'Phone number must be at least 10 digits' }),
  addressPostal: z.string().min(5, { message: 'Postal address is too short' }),
});

export const updatePasswordSchema = z.object({
  oldPassword: z
    .string()
    .min(6, { message: 'Old password must be at least 6 characters long' }),
  newPassword: z
    .string()
    .min(6, { message: 'New password must be at least 6 characters long' }),
});

export const deleteAccountSchema = z.object({
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long' }),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Reset token is required' }),
  newPassword: z
    .string()
    .min(6, { message: 'New password must be at least 6 characters long' }),
});

export const verifyEmailSchema = z.object({
  code: z.string().max(5).min(5, { message: 'Verification code is required' }),
});

export const resendVerificationEmailSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

// Register Child Schema
export const childRegisterChildSchema = z.object({
  birthDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long' }),
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  gender: z.string().min(1, { message: 'Gender is required' }),
  schoolLevel: z.string().min(1, { message: 'School level is required' }),
});

// Update Child Schema
export const childUpdateChildSchema = z.object({
  birthDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long' }),
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  gender: z.string().min(1, { message: 'Gender is required' }),
  schoolLevel: z.string().min(1, { message: 'School level is required' }),
  status: z.boolean(),
});
