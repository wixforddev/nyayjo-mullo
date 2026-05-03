import express from 'express';
import * as productController from '../../controllers/product.controller';
import fileUpload from '../../middlewares/fileUpload';

const upload = fileUpload();

const router = express.Router();

router
  .route('/')
  .get(productController.getProducts)
  .post(upload.single('image'), productController.createProduct);

router
  .route('/:productId')
  .get(productController.getProduct)
  .put(upload.single('image'), productController.updateProduct)
  .delete(productController.deleteProduct);

export default router;
