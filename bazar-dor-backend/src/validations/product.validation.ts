import Joi from 'joi';
import { objectId } from './custom.validation';

const createProduct = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    nameBn: Joi.string().required(),
    unit: Joi.string().default('kg'),
    icon: Joi.string().default('🛒'),
    category: Joi.string().valid('vegetable', 'fish', 'meat', 'dairy', 'grain', 'oil', 'spice', 'other').default('other'),
    defaultPrice: Joi.number().min(0).default(0),
    isActive: Joi.boolean().default(true),
  }),
};

const getProducts = {
  query: Joi.object().keys({
    name: Joi.string(),
    category: Joi.string(),
    isActive: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getProduct = {
  params: Joi.object().keys({
    productId: Joi.string().custom(objectId).required(),
  }),
};

const updateProduct = {
  params: Joi.object().keys({
    productId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    nameBn: Joi.string(),
    unit: Joi.string(),
    icon: Joi.string(),
    category: Joi.string().valid('vegetable', 'fish', 'meat', 'dairy', 'grain', 'oil', 'spice', 'other'),
    defaultPrice: Joi.number().min(0),
    isActive: Joi.boolean(),
  }),
};

const deleteProduct = {
  params: Joi.object().keys({
    productId: Joi.string().custom(objectId).required(),
  }),
};

export { createProduct, getProducts, getProduct, updateProduct, deleteProduct };
