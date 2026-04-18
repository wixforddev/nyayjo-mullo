import express from 'express';
import * as productController from '../../controllers/product.controller';

const router = express.Router();

router.route('/').get(productController.getProducts).post(productController.createProduct);
router.route('/:productId').get(productController.getProduct).put(productController.updateProduct).delete(productController.deleteProduct);

export default router;
