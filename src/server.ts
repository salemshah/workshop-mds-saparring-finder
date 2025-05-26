import 'reflect-metadata';
import 'express-async-errors';
import initializeApp from './app';
import config from './config';
import logger from './utils/logger';
import prisma from './prisma/client';
import { figletText } from './utils/helper-functions';
import { data } from './utils/logger';

const PORT = config.server.port || 8000;
const HOST_NAME = config.server.hostname || 'localhost';

async function startServer() {
  try {
    // connect to db
    figletText();
    await prisma.$connect();
    const app = await initializeApp();

    app.listen(+PORT, HOST_NAME, () => {
      console.table(Object.values(data));
    });
  } catch (err) {
    logger.error('Failed to start the server:', err);
    process.exit(1);
  }
}

startServer();
