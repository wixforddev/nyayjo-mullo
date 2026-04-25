import mongoose from 'mongoose';
import cron from 'node-cron';
import app from './app';
import config from './config/config';
import logger from './config/logger';
import { buildSnapshot } from './services/dailySnapshot.service';

// My Local IP Address
const myIp = process.env.BACKEND_IP;

let server: any;

mongoose.connect(config.mongoose.url, config.mongoose.options as any).then(() => {
  logger.info('Connected to MongoDB');

  // Daily snapshot cron — runs at 23:59 every night (Bangladesh time UTC+6 = 17:59 UTC)
  cron.schedule('59 17 * * *', async () => {
    logger.info('Running daily snapshot cron...');
    try {
      await buildSnapshot(new Date());
      logger.info('Daily snapshot saved successfully');
    } catch (err) {
      logger.error('Daily snapshot cron failed:', err);
    }
  });

  server = app.listen(config.port, myIp, () => {
    logger.info(`Listening to ip http://${myIp}:${config.port}`);
  });

  //initializing socket io
  const socketIo = require('socket.io');
  const socketIO = require('./utils/socketIO').default;
  const io = socketIo(server, {
    cors: {
      origin: '*'
    },
  });

  socketIO(io);

  (global as any).io = io;
  server.listen(config.port, process.env.BACKEND_IP, () => {
    // logger.info(`Socket IO listening to port ${config.port}`);
  });
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: any) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
