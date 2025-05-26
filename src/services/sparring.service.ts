import { Service } from 'typedi';
import prisma from '../prisma/client';
import { Prisma, Sparring } from '@prisma/client';
import CustomError from '../utils/customError';
import { DateTime } from 'luxon';
import { sendPushNotification } from './notification.service';

export interface SparringsResponse {
  sparrings: Sparring[];
}

const PENDING_STATUS = 'PENDING';
const CONFIRMED_STATUS = 'CONFIRMED';
const CANCELLED_STATUS = 'CANCELLED';

@Service()
export class SparringService {
  /* ---------------------------- Create ----------------------------- */
  async createSparring(
    requesterId: number,
    data: Omit<
      Prisma.SparringCreateInput,
      'requester' | 'partner' | 'availability'
    > & {
      partner_id: number;
      availability_id: number;
      scheduled_date: string | Date;
      start_time: string | Date;
      end_time: string | Date;
      notes?: string | null;
    }
  ): Promise<SparringsResponse> {
    if (data.partner_id === requesterId) {
      throw new CustomError(
        'You cannot invite yourself to spar.',
        400,
        'SAME_USER'
      );
    }

    const {
      partner_id,
      availability_id,
      scheduled_date,
      start_time,
      end_time,
      notes,
      ...safeData
    } = data;

    const sparring = await prisma.sparring.create({
      data: {
        ...safeData,
        scheduled_date: this.parseUtc(scheduled_date),
        start_time: this.parseUtc(start_time),
        end_time: this.parseUtc(end_time),
        notes: notes ?? null,
        status: PENDING_STATUS,
        requester: { connect: { id: requesterId } },
        partner: { connect: { id: partner_id } },
        availability: { connect: { id: availability_id } },
      },
    });

    return { sparrings: [sparring] };
  }

  /* ---------------------------- Update ----------------------------- */
  async updateSparring(
    id: number,
    userId: number,
    data: Partial<
      Omit<Prisma.SparringUpdateInput, 'requester' | 'partner' | 'availability'>
    > & {
      scheduled_date?: string | Date;
      start_time?: string | Date;
      end_time?: string | Date;
    }
  ): Promise<SparringsResponse> {
    const sparring = await this.guardExistsAndOwnership(id, userId);

    if (sparring.status !== PENDING_STATUS) {
      throw new CustomError(
        'Only pending sparrings can be modified.',
        400,
        'INVALID_STATUS'
      );
    }

    const updated = await prisma.sparring.update({
      where: { id },
      data: {
        ...data,
        ...(data.scheduled_date && {
          scheduled_date: this.parseUtc(data.scheduled_date),
        }),
        ...(data.start_time && { start_time: this.parseUtc(data.start_time) }),
        ...(data.end_time && { end_time: this.parseUtc(data.end_time) }),
        updated_at: new Date(),
      },
    });

    return { sparrings: [updated] };
  }

  /* ---------------------------- Confirm ---------------------------- */
  // async confirmSparring(
  //   id: number,
  //   partnerId: number
  // ): Promise<SparringsResponse> {
  //   const sparring = await prisma.sparring.findUnique({ where: { id } });
  //   if (!sparring) throw new CustomError('Not found', 404, 'NOT_FOUND');
  //
  //   if (sparring.partner_id !== partnerId) {
  //     throw new CustomError('Not allowed', 403, 'FORBIDDEN');
  //   }
  //   if (sparring.status !== PENDING_STATUS) {
  //     throw new CustomError('Already processed', 400, 'INVALID_STATUS');
  //   }
  //
  //   const confirmed = await prisma.sparring.update({
  //     where: { id },
  //     data: {
  //       status: CONFIRMED_STATUS,
  //       confirmed_at: new Date(),
  //     },
  //   });
  //   return { sparrings: [confirmed] };
  // }

  async confirmSparring(
    id: number,
    partnerId: number
  ): Promise<SparringsResponse> {
    const sparring = await prisma.sparring.findUnique({
      where: { id },
    });

    if (!sparring) {
      throw new CustomError('Not found', 404, 'NOT_FOUND');
    }

    if (sparring.partner_id !== partnerId) {
      throw new CustomError('Not allowed', 403, 'FORBIDDEN');
    }

    if (sparring.status !== PENDING_STATUS) {
      throw new CustomError('Already processed', 400, 'INVALID_STATUS');
    }

    const confirmed = await prisma.sparring.update({
      where: { id },
      data: {
        status: CONFIRMED_STATUS,
        confirmed_at: new Date(),
      },
    });

    // Get FCM token of requester
    const requester = await prisma.user.findUnique({
      where: { id: sparring.requester_id },
      select: { fcmToken: true },
    });

    // Get partner first name for personalization
    const partner = await prisma.profile.findUnique({
      where: { user_id: partnerId },
      select: { first_name: true },
    });

    if (!partner) {
      console.warn(
        `[Notification] No profile found for partner ID: ${partnerId}`
      );
    }

    // Send push notification if requester has a valid FCM token
    if (requester?.fcmToken) {
      try {
        await sendPushNotification(
          requester.fcmToken,
          'Sparring Accepted',
          `${partner?.first_name ?? 'Your partner'} accepted your sparring request.`,
          { sparringId: id.toString() } // All data values must be strings for FCM
        );
      } catch (error) {
        console.error('[FCM] Failed to send push notification:', error);
      }
    }

    return { sparrings: [confirmed] };
  }

  /* ---------------------------- Cancel ----------------------------- */
  async cancelSparring(
    id: number,
    userId: number,
    reason = 'No reason provided'
  ): Promise<SparringsResponse> {
    const sparring = await prisma.sparring.findUnique({ where: { id } });
    if (!sparring) throw new CustomError('Not found', 404, 'NOT_FOUND');

    // requester OR partner can cancel while pending/confirmed
    if (![sparring.requester_id, sparring.partner_id].includes(userId)) {
      throw new CustomError('Not allowed', 403, 'FORBIDDEN');
    }

    if (sparring.status === CANCELLED_STATUS) {
      throw new CustomError('Already cancelled', 400, 'INVALID_STATUS');
    }

    const cancelled = await prisma.sparring.update({
      where: { id },
      data: {
        status: CANCELLED_STATUS,
        cancelled_by_user_id: userId,
        cancellation_reason: reason,
        updated_at: new Date(),
      },
    });

    return { sparrings: [cancelled] };
  }

  /* ------------------------ Get by ID ------------------------------ */
  async getSparringById(id: number): Promise<SparringsResponse> {
    if (isNaN(id)) throw new CustomError('Invalid ID', 400, 'INVALID_ID');
    const sparring = await prisma.sparring.findUnique({ where: { id } });
    return { sparrings: sparring ? [sparring] : [] };
  }

  /* ------------------------ Get all for user ----------------------- */
  async getUserSparrings(
    userId: number,
    role: 'requester' | 'partner' | 'both' = 'both'
  ): Promise<SparringsResponse> {
    if (isNaN(userId)) throw new CustomError('Invalid ID', 400, 'INVALID_ID');

    const filter =
      role === 'both'
        ? { OR: [{ requester_id: userId }, { partner_id: userId }] }
        : role === 'requester'
          ? { requester_id: userId }
          : { partner_id: userId };

    const sparrings = await prisma.sparring.findMany({
      where: filter,
      orderBy: { scheduled_date: 'asc' },
    });

    const enrichedSparrings = await Promise.all(
      sparrings.map(async (sparring) => {
        const requesterProfile = await prisma.profile.findUnique({
          where: { id: sparring.requester_id },
        });

        const partnerProfile = await prisma.profile.findUnique({
          where: { id: sparring.partner_id },
        });

        return {
          ...sparring,
          requesterProfile,
          partnerProfile,
        };
      })
    );

    return { sparrings: enrichedSparrings as never };
  }

  /* ---------------------- Internal helpers ------------------------- */
  /** Throws if sparring doesn’t exist or caller isn’t the requester. */
  private async guardExistsAndOwnership(id: number, requesterId: number) {
    if (isNaN(id)) throw new CustomError('Invalid ID', 400, 'INVALID_ID');
    const sparring = await prisma.sparring.findUnique({ where: { id } });
    if (!sparring || sparring.requester_id !== requesterId) {
      throw new CustomError('Sparring not found', 404, 'SPARRING_NOT_FOUND');
    }
    return sparring;
  }

  private parseUtc(value: string | Date): Date {
    if (value instanceof Date) return value;
    return DateTime.fromISO(value, { zone: 'utc' }).toJSDate();
  }
}
