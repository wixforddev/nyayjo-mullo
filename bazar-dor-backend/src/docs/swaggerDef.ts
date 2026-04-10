import { version } from '../../package.json';
import config from '../config/config';

const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: 'Matromony API documentation',
    version,
    license: {
      name: 'ISC',
    },
  },
  servers: [
    {
      url: `http://${process.env.BACKEND_IP}:${config.port}/v1`,
    },
  ],
};

export default swaggerDef;
