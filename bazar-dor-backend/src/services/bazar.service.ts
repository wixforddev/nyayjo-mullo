import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { Bazar } from '../models';

const createBazar = async (data: any) => {
  const bazar = await Bazar.create(data);
  return bazar;
};

const queryBazars = async (filter: any, options: any) => {
  const { limit = 20, page = 1 } = options;
  const count = await Bazar.countDocuments(filter);
  const totalPages = Math.ceil(count / limit);
  const skip = (page - 1) * limit;

  const bazars = await Bazar.find(filter).skip(skip).limit(parseInt(limit)).sort({ name: 1 });

  return {
    data: bazars,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages,
    totalResults: count,
  };
};

const getBazarById = async (id: string) => {
  const bazar = await Bazar.findById(id);
  if (!bazar) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bazar not found');
  }
  return bazar;
};

const updateBazarById = async (id: string, bodyData: any) => {
  const bazar = await getBazarById(id);
  Object.assign(bazar, bodyData);
  await bazar.save();
  return bazar;
};

const deleteBazarById = async (id: string) => {
  const bazar = await Bazar.findByIdAndDelete(id);
  if (!bazar) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bazar not found');
  }
  return bazar;
};

export { createBazar, queryBazars, getBazarById, updateBazarById, deleteBazarById };
