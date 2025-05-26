import dotenv from 'dotenv';
import * as process from 'node:process';

dotenv.config();

const config = {
  server: {
    port: process.env.PORT || (8000 as number),
    hostname: process.env.SERVER_HOST_NAME || 'localhost',
  },
  fcm: {
    serverKey: process.env.FCM_SERVER_KEY!,
  },
  jwt: {
    accessTokenSecret:
      process.env.ACCESS_TOKEN_SECRET || ('sparring_secret' as string),
    refreshTokenSecret:
      process.env.REFRESH_TOKEN_SECRET || ('sparring_refresh_secret' as string),
    refreshTokenExpiresIn: '7d' as string,
    accessTokenExpiresIn: '7d' as string,
  },
  smtp: {
    host: process.env.EMAIL_HOST || ('smtp-relay.brevo.com' as string),
    port: process.env.EMAIL_PORT || ('587' as string),
    isSecure: false,
    user: process.env.EMAIL_USER || ('xyz@smtp-brevo.com' as string),
    password: process.env.EMAIL_PASS || ('xyz' as string),
    from: process.env.EMAIL_FROM || ('salem@gmail.com' as string),
  },
};

export default config;
