import 'reflect-metadata';
import 'express-async-errors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import initializeApp from './app';
import config from './config';
import logger from './utils/logger';
import prisma from './prisma/client';
import { figletText } from './utils/helper-functions';
import { data } from './utils/logger';
import socketLoader from './loaders/socket.loader';

const PORT = config.server.port || 8000;
const HOST_NAME = config.server.hostname || 'localhost';

async function startServer() {
  try {
    figletText();
    await prisma.$connect();
    const app = await initializeApp();

    // Create an HTTP server from Express
    const httpServer = http.createServer(app);

    // Attach Socket.IO to that HTTP server
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*', // adjust as needed
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Call our loader to set up auth + event scaffolding
    socketLoader(io);

    // Start listening
    httpServer.listen(+PORT, HOST_NAME, () => {
      console.table(Object.values(data));
      console.log(`🚀 Server listening on http://${HOST_NAME}:${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start the server:', err);
    process.exit(1);
  }
}

startServer();
