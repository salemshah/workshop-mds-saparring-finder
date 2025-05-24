import { z } from 'zod';

const isoDateTime = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Invalid date-time format',
});

export const createSparringSchema = z.object({
  partner_id: z.number().int().min(1, 'Partner ID is required'),
  availability_id: z.number().int().min(1, 'Availability ID is required'),
  scheduled_date: isoDateTime,
  start_time: isoDateTime,
  end_time: isoDateTime,
  location: z.string().min(1, 'Location is required'),
  notes: z.string().optional().nullable(),
});

export const updateSparringSchema = z.object({
  scheduled_date: isoDateTime.optional(),
  start_time: isoDateTime.optional(),
  end_time: isoDateTime.optional(),
  location: z.string().min(1).optional(),
  notes: z.string().optional().nullable(),
});

export const cancelSparringSchema = z.object({
  reason: z.string().optional(),
});
