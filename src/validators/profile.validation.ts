import { z } from 'zod';

// Helper
const isoDateString = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Invalid date format',
});

const genderEnum = z.enum(['Male', 'Female', 'Other']);
const skillLevelEnum = z.enum([
  'Beginner',
  'Intermediate',
  'Advanced',
  'Professional',
]);

export const createProfileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  bio: z.string().optional(),
  date_of_birth: isoDateString,
  gender: genderEnum,
  weight_class: z.string().min(1, 'Weight class is required'),
  skill_level: skillLevelEnum,
  years_experience: z.string().max(11),
  preferred_styles: z.string().min(1, 'Preferred styles is required'),
  gym_name: z.string().min(1, 'Gym name is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  verified: z.boolean().optional(),
});

// 🛠 Update Profile Schema (photo_url excluded)
export const updateProfileSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  date_of_birth: isoDateString.optional(),
  gender: genderEnum.optional(),
  weight_class: z.string().min(1).optional(),
  skill_level: skillLevelEnum.optional(),
  years_experience: z.string().max(11),
  preferred_styles: z.string().min(1).optional(),
  gym_name: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  verified: z.boolean().optional(),
});
