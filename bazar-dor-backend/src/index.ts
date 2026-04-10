import mongoose from 'mongoose';
import app from './app';
import config from './config/config';
import logger from './config/logger';

// My Local IP Address
const myIp = process.env.BACKEND_IP;

let server: any;

mongoose.connect(config.mongoose.url, config.mongoose.options as any).then(() => {
  logger.info('Connected to MongoDB');
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
