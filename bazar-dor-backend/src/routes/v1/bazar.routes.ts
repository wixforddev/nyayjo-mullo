import express from 'express';
import auth from '../../middlewares/auth';
import * as bazarController from '../../controllers/bazar.controller';

const router = express.Router();

router
  .route('/')
  .get(bazarController.getBazars)
  .post(auth('common'), bazarController.createBazar);

router
  .route('/:bazarId')
  .get(bazarController.getBazar)
  .put(auth('common'), bazarController.updateBazar)
  .delete(auth('admin'), bazarController.deleteBazar);

export default router;
