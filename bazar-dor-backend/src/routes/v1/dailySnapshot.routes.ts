import express from 'express';
import * as snapshotController from '../../controllers/dailySnapshot.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

router.get('/',          auth('common'), snapshotController.getSnapshots);
router.get('/:date',     auth('common'), snapshotController.getSnapshotByDate);
router.post('/trigger',  auth('admin'),  snapshotController.triggerSnapshot);

export default router;
