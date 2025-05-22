import { z } from 'zod';

// ISO Date format validator
const isoDateTime = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Invalid date-time format',
});

export const createAvailabilitySchema = z.object({
  specific_date: isoDateTime,
  start_time: isoDateTime,
  end_time: isoDateTime,
  location: z.string().min(3, 'Location is required'),
});

export const updateAvailabilitySchema = z.object({
  specific_date: isoDateTime.optional(),
  start_time: isoDateTime.optional(),
  end_time: isoDateTime.optional(),
  location: z.string().min(3).optional(),
});
