import Joi from 'joi';
import { objectId } from './custom.validation';

const createAlert = {
  body: Joi.object().keys({
    type: Joi.string().valid('price_spike', 'stock_out', 'market_closed', 'general').required(),
    message: Joi.string().required(),
    messageBn: Joi.string().allow('').default(''),
    productId: Joi.string().custom(objectId).allow(null).default(null),
    bazarId: Joi.string().custom(objectId).allow(null).default(null),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
    isActive: Joi.boolean().default(true),
    expiresAt: Joi.date().default(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  }),
};

const getAlerts = {
  query: Joi.object().keys({
    type: Joi.string(),
    severity: Joi.string(),
    bazarId: Joi.string().custom(objectId),
    productId: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getAlert = {
  params: Joi.object().keys({
    alertId: Joi.string().custom(objectId).required(),
  }),
};

const updateAlert = {
  params: Joi.object().keys({
    alertId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    message: Joi.string(),
    messageBn: Joi.string(),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical'),
    isActive: Joi.boolean(),
    expiresAt: Joi.date(),
  }),
};

const deleteAlert = {
  params: Joi.object().keys({
    alertId: Joi.string().custom(objectId).required(),
  }),
};

export { createAlert, getAlerts, getAlert, updateAlert, deleteAlert };
