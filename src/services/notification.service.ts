import { NotificationType } from '../interfaces/notifications';
import { Service } from 'typedi';
import prisma from '../prisma/client';
import admin from '../config/firebase';
import CustomError from '../utils/customError';

@Service()
export class NotificationService {
  /**
   * Create a new notification record and send push notification via FCM.
   */
  async createAndSend({
    recipientId,
    senderId,
    title,
    body,
    type,
    via = 'push',
    actionUrl = null,
    data = {},
  }: {
    recipientId: number;
    senderId: number;
    title: string;
    body: string;
    type: NotificationType;
    via?: string;
    actionUrl?: string | null;
    data?: Record<string, string>;
  }): Promise<void> {
    // 1. Save notification in database
    await prisma.notification.create({
      data: {
        user_id: recipientId,
        sender_id: senderId,
        title,
        body,
        type,
        is_read: false,
        via,
        sent_at: new Date(),
        action_url: actionUrl,
      },
    });

    // 2. Fetch FCM token of recipient
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { fcmToken: true },
    });

    if (recipient?.fcmToken) {
      try {
        await this.sendPushNotification(recipient.fcmToken, title, body, data);
      } catch (err) {
        console.error('[NotificationService] Failed to send FCM push:', err);
      }
    }
  }

  /**
   * Get a single notification by ID (with sender info).
   */
  async getById(id: number, userId: number) {
    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        sender: true,
      },
    });

    if (!notification || notification.user_id !== userId) {
      throw new CustomError('Notification not found', 404, 'NOT_FOUND');
    }

    return notification;
  }

  /**
   * List all notifications for a specific user.
   */
  async listAllByUser(userId: number) {
    const notifications = await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { sent_at: 'desc' },
      include: {
        sender: {
          select: {
            profile: true,
          },
        },
      },
    });

    return notifications.map((n) => ({
      ...n,
      senderProfile: n.sender?.profile,
      sender: undefined,
    }));
  }

  /**
   * Delete a notification by ID (only if it belongs to the user).
   */
  async deleteById(id: number, userId: number) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.user_id !== userId) {
      throw new CustomError(
        'Notification not found or unauthorized',
        404,
        'NOT_FOUND'
      );
    }

    await prisma.notification.delete({ where: { id } });

    return { message: 'Notification deleted successfully' };
  }

  /**
   * Internal: Send push notification using Firebase Admin SDK.
   */
  private async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data: Record<string, string> = {}
  ): Promise<void> {
    await admin.messaging().send({
      token,
      notification: { title, body },
      data,
    });
  }
}
