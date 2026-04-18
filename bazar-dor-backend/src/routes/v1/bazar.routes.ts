import express from 'express';
import * as bazarController from '../../controllers/bazar.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

// Specific routes BEFORE /:bazarId
router.get('/nearby', bazarController.getNearbyBazars);
router.post('/add', auth('common'), bazarController.createBazar);

router.route('/')
  .get(auth('common'), bazarController.getBazars)
  .post(auth('common'), bazarController.createBazar);

router.route('/:bazarId')
  .get(auth('common'), bazarController.getBazar)
  .put(auth('common'), bazarController.updateBazar)
  .delete(auth('common'), bazarController.deleteBazar);

export default router;
