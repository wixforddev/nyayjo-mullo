import express from 'express';
import auth from '../../middlewares/auth';
import * as alertController from '../../controllers/alert.controller';

const router = express.Router();

router
  .route('/')
  .get(alertController.getAlerts)
  .post(auth('common'), alertController.createAlert);

router
  .route('/:alertId')
  .get(alertController.getAlert)
  .put(auth('common'), alertController.updateAlert)
  .delete(auth('admin'), alertController.deleteAlert);

export default router;
