import express from 'express';
import auth from '../../middlewares/auth';
import * as productController from '../../controllers/product.controller';

const router = express.Router();

router
  .route('/')
  .get(auth('common'), productController.getProducts)
  .post(auth('common'), productController.createProduct);

router
  .route('/:productId')
  .get(auth('common'), productController.getProduct)
  .put(auth('common'), productController.updateProduct)
  .delete(auth('admin'), productController.deleteProduct);

export default router;
