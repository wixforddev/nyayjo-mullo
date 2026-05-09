import express from 'express';
import * as bazarController from '../../controllers/bazar.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/nearby', bazarController.getNearbyBazars);

router.route('/')
  .get(bazarController.getBazars)
  .post(auth('common'), bazarController.createBazar);

router.route('/:bazarId')
  .get(bazarController.getBazar)
  .put(auth('common'), bazarController.updateBazar)
  .delete(auth('common'), bazarController.deleteBazar);

// ── Admin — Google Places cache management ────────────────────────────────────
router.post('/seed/cell',  auth('common'), bazarController.seedCell);
router.get('/seed/status', auth('common'), bazarController.getCacheStatus);
router.post('/add',        auth('common'), bazarController.createBazar);

export default router;
