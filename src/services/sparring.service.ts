import { Service } from 'typedi';
import prisma from '../prisma/client';
import { Prisma, Sparring } from '@prisma/client';
import CustomError from '../utils/customError';
import { DateTime } from 'luxon';
import { NotificationService } from './notification.service';

export interface SparringsResponse {
  sparrings: Sparring[];
}

const PENDING_STATUS = 'PENDING';
const CONFIRMED_STATUS = 'CONFIRMED';
const CANCELLED_STATUS = 'CANCELLED';

@Service()
export class SparringService {
  constructor(private readonly notificationService: NotificationService) {}

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

    // Get requester's profile info
    const requesterProfile = await prisma.profile.findUnique({
      where: { user_id: requesterId },
      select: { first_name: true },
    });

    // Notify partner about the sparring request
    await this.notificationService.createAndSend({
      recipientId: partner_id,
      senderId: requesterId,
      title: 'New Sparring Request',
      body: `${requesterProfile?.first_name ?? 'Someone'} sent you a sparring request.`,
      type: 'sparring_request',
      actionUrl: `/sparring/${sparring.id}`,
      data: {
        sparringId: sparring.id.toString(),
        screen: 'notification',
      },
    });

    return { sparrings: [sparring] };
  }

  /* ---------------------------- Confirm ---------------------------- */
  async confirmSparring(
    id: number,
    partnerId: number
  ): Promise<SparringsResponse> {
    const sparring = await prisma.sparring.findUnique({ where: { id } });
    if (!sparring) throw new CustomError('Not found', 404, 'NOT_FOUND');
    if (sparring.partner_id !== partnerId)
      throw new CustomError('Not allowed', 403, 'FORBIDDEN');
    if (sparring.status !== PENDING_STATUS)
      throw new CustomError('Already processed', 400, 'INVALID_STATUS');

    const confirmed = await prisma.sparring.update({
      where: { id },
      data: {
        status: CONFIRMED_STATUS,
        confirmed_at: new Date(),
      },
    });

    const partnerProfile = await prisma.profile.findUnique({
      where: { user_id: partnerId },
      select: { first_name: true },
    });

    // Notify requester that partner accepted the sparring
    await this.notificationService.createAndSend({
      recipientId: sparring.requester_id,
      senderId: partnerId,
      title: 'Sparring Accepted',
      body: `${partnerProfile?.first_name ?? 'Your partner'} accepted your sparring request.`,
      type: 'sparring_confirmed',
      actionUrl: `/sparring/${sparring.id}`,
      data: {
        sparringId: sparring.id.toString(),
        screen: 'notification',
      },
    });

    return { sparrings: [confirmed] };
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
          where: { user_id: sparring.requester_id },
        });

        const partnerProfile = await prisma.profile.findUnique({
          where: { user_id: sparring.partner_id },
        });
        return {
          ...sparring,
          requesterProfile,
          partnerProfile,
        };
      })
    );
    // console.log('sparrings', enrichedSparrings);
    return { sparrings: enrichedSparrings as never };
  }

  /* ------------------------ Get all for requestId =>(userId) and partnerId ----------------------- */
  async getSparringsByRequestedIdAndPartnerId(
    userId: number,
    partnerId: number
  ): Promise<SparringsResponse> {
    if (isNaN(userId)) throw new CustomError('Invalid ID', 400, 'INVALID_ID');

    const sparrings = await prisma.sparring.findMany({
      where: { requester_id: userId, partner_id: partnerId },
      orderBy: { scheduled_date: 'asc' },
    });

    const enrichedSparrings = await Promise.all(
      sparrings.map(async (sparring) => {
        const requesterProfile = await prisma.profile.findUnique({
          where: { user_id: sparring.requester_id },
        });

        const partnerProfile = await prisma.profile.findUnique({
          where: { user_id: sparring.partner_id },
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
