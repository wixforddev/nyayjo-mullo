import { Request, Response } from 'express';
import httpStatus from 'http-status';
import response from '../config/response';
import { productService } from '../services';
import catchAsync from '../utils/catchAsync';
import pick from '../utils/pick';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary';

const createProduct = catchAsync(async (req: Request, res: Response) => {
  if ((req as any).file) {
    req.body.image = await uploadToCloudinary((req as any).file.buffer, 'bazar-dor/products');
  }
  const product = await productService.createProduct(req.body);
  res.status(httpStatus.CREATED).json(
    response({
      message: 'Product created successfully',
      status: 'OK',
      statusCode: httpStatus.CREATED,
      data: product,
    }),
  );
});

const getProducts = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['name', 'category', 'isActive']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await productService.queryProducts(filter, options);
  res.status(httpStatus.OK).json(
    response({
      message: 'Products retrieved successfully',
      status: 'OK',
      statusCode: httpStatus.OK,
      data: result,
    }),
  );
});

const getProduct = catchAsync(async (req: Request, res: Response) => {
  const productId = Array.isArray(req.params.productId)
    ? req.params.productId[0]
    : req.params.productId;
  const product = await productService.getProductById(productId);
  res.status(httpStatus.OK).json(
    response({
      message: 'Product retrieved successfully',
      status: 'OK',
      statusCode: httpStatus.OK,
      data: product,
    }),
  );
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const productId = Array.isArray(req.params.productId)
    ? req.params.productId[0]
    : req.params.productId;
  if ((req as any).file) {
    const existing = await productService.getProductById(productId);
    if (existing?.image) await deleteFromCloudinary(existing.image);
    req.body.image = await uploadToCloudinary((req as any).file.buffer, 'bazar-dor/products');
  }
  const product = await productService.updateProductById(productId, req.body);
  res.status(httpStatus.OK).json(
    response({
      message: 'Product updated successfully',
      status: 'OK',
      statusCode: httpStatus.OK,
      data: product,
    }),
  );
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const productId = Array.isArray(req.params.productId)
    ? req.params.productId[0]
    : req.params.productId;
  const product = await productService.deleteProductById(productId);
  res.status(httpStatus.OK).json(
    response({
      message: 'Product deleted successfully',
      status: 'OK',
      statusCode: httpStatus.OK,
      data: product,
    }),
  );
});

export { createProduct, getProducts, getProduct, updateProduct, deleteProduct };
