import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { Alert } from '../models';

const createAlert = async (data: any) => {
  const alert = await Alert.create(data);
  return alert;
};

const queryAlerts = async (filter: any, options: any) => {
  const { limit = 20, page = 1 } = options;
  // Default to only active alerts
  const queryFilter = { isActive: true, expiresAt: { $gte: new Date() }, ...filter };
  const count = await Alert.countDocuments(queryFilter);
  const totalPages = Math.ceil(count / limit);
  const skip = (page - 1) * limit;

  const alerts = await Alert.find(queryFilter)
    .populate('productId', 'name nameBn icon')
    .populate('bazarId', 'name nameBn area')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ severity: -1, createdAt: -1 });

  return {
    data: alerts,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages,
    totalResults: count,
  };
};

const getAlertById = async (id: string) => {
  const alert = await Alert.findById(id)
    .populate('productId', 'name nameBn icon')
    .populate('bazarId', 'name nameBn area');
  if (!alert) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Alert not found');
  }
  return alert;
};

const updateAlertById = async (id: string, bodyData: any) => {
  const alert = await getAlertById(id);
  Object.assign(alert, bodyData);
  await alert.save();
  return alert;
};

const deleteAlertById = async (id: string) => {
  const alert = await Alert.findByIdAndDelete(id);
  if (!alert) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Alert not found');
  }
  return alert;
};

export { createAlert, queryAlerts, getAlertById, updateAlertById, deleteAlertById };
