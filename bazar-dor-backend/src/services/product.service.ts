import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { Product } from '../models';

const createProduct = async (data: any) => {
  const product = await Product.create(data);
  return product;
};

const queryProducts = async (filter: any, options: any) => {
  const { limit = 20, page = 1 } = options;
  const count = await Product.countDocuments(filter);
  const totalPages = Math.ceil(count / limit);
  const skip = (page - 1) * limit;

  const products = await Product.find(filter).skip(skip).limit(parseInt(limit)).sort({ name: 1 });

  return {
    data: products,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages,
    totalResults: count,
  };
};

const getProductById = async (id: string) => {
  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }
  return product;
};

const updateProductById = async (id: string, bodyData: any) => {
  const product = await getProductById(id);
  Object.assign(product, bodyData);
  await product.save();
  return product;
};

const deleteProductById = async (id: string) => {
  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }
  return product;
};

export { createProduct, queryProducts, getProductById, updateProductById, deleteProductById };
