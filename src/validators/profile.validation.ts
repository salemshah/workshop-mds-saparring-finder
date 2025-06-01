import { z } from 'zod';

const isoDateTime = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Date of birth must be a valid ISO 8601 date-time string',
});

const genderEnum = z.enum(['Male', 'Female', 'Other'], {
  errorMap: (issue, ctx) => {
    if (issue.code === 'invalid_type') {
      return { message: 'Gender must be a string' };
    }
    if (issue.code === 'invalid_enum_value') {
      return { message: 'Gender must be one of: Male, Female, or Other' };
    }
    return { message: ctx.defaultError };
  },
});

const skillLevelEnum = z.enum(
  ['Beginner', 'Intermediate', 'Advanced', 'Professional'],
  {
    errorMap: (issue, ctx) => {
      if (issue.code === 'invalid_type') {
        return { message: 'Skill level must be a string' };
      }
      if (issue.code === 'invalid_enum_value') {
        return {
          message:
            'Skill level must be one of: Beginner, Intermediate, Advanced, Professional',
        };
      }
      return { message: ctx.defaultError };
    },
  }
);

export const createProfileSchema = z.object({
  first_name: z.string().min(1, { message: 'First name is required' }),
  last_name: z.string().min(1, { message: 'Last name is required' }),
  bio: z.string().optional(),
  date_of_birth: isoDateTime,
  gender: genderEnum,
  weight_class: z.string().min(1, { message: 'Weight class is required' }),
  skill_level: skillLevelEnum,
  years_experience: z.string().max(11, {
    message: 'Years of experience must be no longer than 11 characters',
  }),
  preferred_styles: z
    .string()
    .min(1, { message: 'Preferred styles is required' }),
  gym_name: z.string().min(1, { message: 'Gym name is required' }),
  city: z.string().min(1, { message: 'City is required' }),
  country: z.string().min(1, { message: 'Country is required' }),
  latitude: z.string().min(1, { message: 'Latitude is required' }),
  longitude: z.string().min(1, { message: 'Longitude is required' }),
  address: z
    .string()
    .min(5, { message: 'Address must be at least 5 characters long' }),
  verified: z.boolean().optional(),
});

// Update Profile Schema (photo_url excluded)
export const updateProfileSchema = z.object({
  first_name: z
    .string()
    .min(3, { message: 'First name must be at least 3 characters' })
    .optional(),
  last_name: z
    .string()
    .min(3, { message: 'Last name must be at least 3 characters' })
    .optional(),
  date_of_birth: isoDateTime.optional(),
  gender: genderEnum.optional(),
  weight_class: z
    .string()
    .min(1, { message: 'Weight class is required' })
    .optional(),
  skill_level: skillLevelEnum.optional(),
  years_experience: z
    .string()
    .max(11, {
      message: 'Years of experience must be no longer than 11 characters',
    })
    .optional(),
  preferred_styles: z
    .string()
    .min(1, { message: 'Preferred styles is required' })
    .optional(),
  gym_name: z.string().min(1, { message: 'Gym name is required' }).optional(),
  city: z.string().min(1, { message: 'City is required' }).optional(),
  country: z.string().min(1, { message: 'Country is required' }).optional(),
  latitude: z.string().min(1, { message: 'Latitude is required' }).optional(),
  longitude: z.string().min(1, { message: 'Longitude is required' }).optional(),
  address: z
    .string()
    .min(5, { message: 'Address must be at least 5 characters long' })
    .optional(),
  verified: z.boolean().optional(),
});
