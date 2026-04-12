import express from 'express';
import auth from '../../middlewares/auth';
import * as priceController from '../../controllers/price.controller';

const router = express.Router();

router
  .route('/')
  .get(priceController.getPrices)
  .post(auth('common'), priceController.createPrice);

router
  .route('/basket')
  .get(priceController.getBasket);

router
  .route('/heatmap')
  .get(priceController.getHeatmap);

router
  .route('/history/:productId')
  .get(priceController.getPriceHistory);

router
  .route('/:priceId')
  .get(priceController.getPrice)
  .delete(auth('common'), priceController.deletePrice);

router
  .route('/:priceId/vote')
  .post(auth('common'), priceController.votePrice);

router
  .route('/:priceId/stock-out')
  .post(auth('common'), priceController.markStockOut);

export default router;
