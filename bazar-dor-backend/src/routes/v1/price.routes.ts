import express from 'express';
import * as priceController from '../../controllers/price.controller';
import auth from '../../middlewares/auth';

const router = express.Router();


router.route('/').post(auth("common"), priceController.createPrice);
router.route('/').get(auth("common"), priceController.getPrices);
router.route('/basket').get(auth("common"), priceController.getBasket);
router.route('/heatmap').get(auth("common"), priceController.getHeatmap);
router.route('/history/:productId').get(auth("common"), priceController.getPriceHistory);
router.route('/:priceId').get(auth("common"), priceController.getPrice).delete(auth("common"), priceController.deletePrice);
router.route('/:priceId/vote').post(auth("common"), priceController.votePrice);
router.route('/:priceId/stock-out').post(auth("common"), priceController.markStockOut);

export default router;
