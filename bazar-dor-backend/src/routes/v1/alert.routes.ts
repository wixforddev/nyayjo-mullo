import express from 'express';
import * as alertController from '../../controllers/alert.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

router.route('/').post(auth("common"), alertController.createAlert);
router.route('/').get(alertController.getAlerts);
router.route('/:alertId').get(alertController.getAlert).put(alertController.updateAlert).delete(alertController.deleteAlert);

export default router;
