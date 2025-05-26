import admin from '../config/firebase';

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
) {
  await admin.messaging().send({
    token,
    notification: { title, body },
    data,
  });
}
