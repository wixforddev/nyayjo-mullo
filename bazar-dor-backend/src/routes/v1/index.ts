import express from 'express';
import config from '../../config/config';
import authRoute from './auth.routes';
import userRoute from './user.routes';
import docsRoute from './docs.routes';
import taskRoute from './tasks.routes';

const router = express.Router();

const defaultRoutes: { path: string; route: any }[] = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/tasks',
    route: taskRoute,
  },
];

const devRoutes: { path: string; route: any }[] = [
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

export default router;
