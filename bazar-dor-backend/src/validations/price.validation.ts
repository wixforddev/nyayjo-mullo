import Joi from 'joi';
import { objectId } from './custom.validation';

const createPrice = {
  body: Joi.object().keys({
    productId: Joi.string().custom(objectId).required(),
    bazarId: Joi.string().custom(objectId).required(),
    price: Joi.number().min(0).required(),
    visitType: Joi.string().valid('physical', 'online').default('physical'),
    photoUrl: Joi.string().allow('').default(''),
    isStockOut: Joi.boolean().default(false),
  }),
};

const getPrices = {
  query: Joi.object().keys({
    productId: Joi.string().custom(objectId),
    bazarId: Joi.string().custom(objectId),
    userId: Joi.string().custom(objectId),
    isVerified: Joi.boolean(),
    isStockOut: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getPrice = {
  params: Joi.object().keys({
    priceId: Joi.string().custom(objectId).required(),
  }),
};

const votePrice = {
  params: Joi.object().keys({
    priceId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    voteType: Joi.string().valid('up', 'down').required(),
  }),
};

const markStockOut = {
  params: Joi.object().keys({
    priceId: Joi.string().custom(objectId).required(),
  }),
};

const getBasket = {
  query: Joi.object().keys({
    bazarId: Joi.string().custom(objectId).required(),
  }),
};

const getHeatmap = {
  query: Joi.object().keys({
    productId: Joi.string().custom(objectId).required(),
  }),
};

const getPriceHistory = {
  params: Joi.object().keys({
    productId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    bazarId: Joi.string().custom(objectId),
  }),
};

const deletePrice = {
  params: Joi.object().keys({
    priceId: Joi.string().custom(objectId).required(),
  }),
};

export {
  createPrice,
  getPrices,
  getPrice,
  votePrice,
  markStockOut,
  getBasket,
  getHeatmap,
  getPriceHistory,
  deletePrice,
};
