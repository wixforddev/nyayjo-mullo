import express from 'express';
import * as snapshotController from '../../controllers/dailySnapshot.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

router.get('/',          snapshotController.getSnapshots);
router.get('/:date',     snapshotController.getSnapshotByDate);
router.post('/trigger',  auth('admin'),  snapshotController.triggerSnapshot);

export default router;
