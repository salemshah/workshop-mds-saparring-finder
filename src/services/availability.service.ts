import { Service } from 'typedi';
import prisma from '../prisma/client';
import { Prisma, Availability } from '@prisma/client';
import CustomError from '../utils/customError';

export interface AvailabilitiesResponse {
  availabilities: Availability[];
}

@Service()
export class AvailabilityService {
  /** --------------------------- Create ---------------------------------- */
  async createAvailability(
    userId: number,
    data: Omit<Prisma.AvailabilityCreateInput, 'user'> & {
      specific_date: string | Date;
      start_time: string | Date;
      end_time: string | Date;
    }
  ): Promise<AvailabilitiesResponse> {
    await prisma.availability.create({
      data: {
        ...data,
        specific_date: new Date(data.specific_date),
        start_time: new Date(data.start_time),
        end_time: new Date(data.end_time),
        user: { connect: { id: userId } },
      },
    });

    return this.getAllAvailabilities(userId);
  }

  /** --------------------------- Update ---------------------------------- */
  async updateAvailability(
    id: number,
    userId: number,
    data: Partial<Prisma.AvailabilityUpdateInput> & {
      specific_date?: string | Date;
      start_time?: string | Date;
      end_time?: string | Date;
    }
  ): Promise<AvailabilitiesResponse> {
    if (isNaN(id)) throw new CustomError('Invalid ID', 400, 'INVALID_ID');

    const existing = await prisma.availability.findUnique({ where: { id } });

    if (!existing || existing.user_id !== userId) {
      throw new CustomError(
        'Availability not found',
        404,
        'AVAILABILITY_NOT_FOUND'
      );
    }

    await prisma.availability.update({
      where: { id },
      data: {
        ...data,
        ...(data.specific_date && {
          specific_date: new Date(data.specific_date),
        }),
        ...(data.start_time && { start_time: new Date(data.start_time) }),
        ...(data.end_time && { end_time: new Date(data.end_time) }),
      },
    });

    const updated = await prisma.availability.findUnique({ where: { id } });
    return { availabilities: updated ? [updated] : [] };
  }

  /** --------------------------- Delete ---------------------------------- */
  async deleteAvailability(id: number, userId: number): Promise<void> {
    if (isNaN(id)) throw new CustomError('Invalid ID', 400, 'INVALID_ID');
    const existing = await prisma.availability.findUnique({ where: { id } });

    if (!existing || existing.user_id !== userId) {
      throw new CustomError(
        'Availability not found',
        404,
        'AVAILABILITY_NOT_FOUND'
      );
    }

    await prisma.availability.delete({ where: { id } });
  }

  /** --------------------------- Get by ID ------------------------------ */
  async getAvailabilityById(id: number): Promise<AvailabilitiesResponse> {
    if (isNaN(id)) throw new CustomError('Invalid ID', 400, 'INVALID_ID');
    const availability = await prisma.availability.findUnique({
      where: { id },
    });
    return { availabilities: availability ? [availability] : [] };
  }

  /** --------------------------- Get all -------------------------------- */
  async getAllAvailabilities(userId: number): Promise<AvailabilitiesResponse> {
    const availabilities = await prisma.availability.findMany({
      where: { user_id: userId },
      orderBy: { specific_date: 'asc' },
    });

    return { availabilities };
  }
}
