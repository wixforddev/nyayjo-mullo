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

// Haversine distance in km
const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getNearbyBazars = async (lat: number, lng: number, limit = 20) => {
  const bazars = await Bazar.find({ isActive: true });
  return bazars
    .map((b: any) => ({ ...b.toJSON(), distance: Math.round(haversineKm(lat, lng, b.lat, b.lng) * 10) / 10 }))
    .sort((a: any, b: any) => a.distance - b.distance)
    .slice(0, limit);
};

export { createBazar, queryBazars, getBazarById, updateBazarById, deleteBazarById, getNearbyBazars };
