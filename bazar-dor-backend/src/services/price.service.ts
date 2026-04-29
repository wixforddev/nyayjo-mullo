import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { Price } from '../models';
import { detectPriceSpike } from './alert.service';

const createPrice = async (data: any) => {
  const price = await Price.create(data);

  // Auto-alert if price is a spike (non-blocking)
  if (price.productId && price.price) {
    detectPriceSpike(
      price.productId.toString(),
      price.price,
      price.bazarId?.toString(),
      price.userId?.toString(),
    );
  }

  return price;
};

const queryPrices = async (filter: any, options: any) => {
  const { limit = 20, page = 1 } = options;
  const count = await Price.countDocuments(filter);
  const totalPages = Math.ceil(count / limit);
  const skip = (page - 1) * limit;

  const prices = await Price.find(filter)
    .populate('productId', 'name nameBn unit icon category')
    .populate('bazarId', 'name nameBn area city')
    .populate('userId', '_id name')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  return {
    data: prices,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages,
    totalResults: count,
  };
};

const getPriceById = async (id: string) => {
  const price = await Price.findById(id)
    .populate('productId', 'name nameBn unit icon category')
    .populate('bazarId', 'name nameBn area city')
    .populate('userId', '_id name');
  if (!price) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Price entry not found');
  }
  return price;
};

const updatePriceById = async (id: string, bodyData: any) => {
  const price = await getPriceById(id);
  Object.assign(price, bodyData);
  await price.save();
  return price;
};

const deletePriceById = async (id: string) => {
  const price = await Price.findByIdAndDelete(id);
  if (!price) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Price entry not found');
  }
  return price;
};

const votePrice = async (priceId: string, voteType: 'up' | 'down', userId: string) => {
  const price = await Price.findById(priceId);
  if (!price) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Price entry not found');
  }

  // Check if this user already voted on this price
  const alreadyVoted = price.voters.some(
    (v: any) => v.userId.toString() === userId.toString()
  );
  if (alreadyVoted) {
    throw new ApiError(httpStatus.CONFLICT, 'আপনি ইতিমধ্যে এই দামে ভোট দিয়েছেন');
  }

  // Record voter
  price.voters.push({ userId: userId as any, voteType });

  if (voteType === 'up') {
    price.upvotes += 1;
  } else {
    price.downvotes += 1;
  }

  // Recalculate confidence score
  const total = price.upvotes + price.downvotes;
  if (total > 0) {
    price.confidenceScore = Math.round((price.upvotes / total) * 100);
    // Auto-verify if confidence > 70% and at least 3 votes
    if (price.confidenceScore >= 70 && total >= 3) {
      price.isVerified = true;
    }
  }

  await price.save();
  return price;
};

const markStockOut = async (priceId: string) => {
  const price = await Price.findById(priceId);
  if (!price) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Price entry not found');
  }
  price.isStockOut = true;
  await price.save();
  return price;
};

const getBasketSummary = async (bazarId: string) => {
  const prices = await Price.aggregate([
    {
      $match: {
        bazarId: new (require('mongoose').Types.ObjectId)(bazarId),
        isStockOut: false,
        expiresAt: { $gte: new Date() },
      },
    },
    {
      $group: {
        _id: '$productId',
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $project: {
        productId: '$_id',
        name: '$product.name',
        nameBn: '$product.nameBn',
        unit: '$product.unit',
        icon: '$product.icon',
        avgPrice: { $round: ['$avgPrice', 2] },
        minPrice: 1,
        maxPrice: 1,
        submissionCount: '$count',
      },
    },
  ]);

  return prices;
};

const getHeatmapData = async (productId: string) => {
  const prices = await Price.aggregate([
    {
      $match: {
        productId: new (require('mongoose').Types.ObjectId)(productId),
        isStockOut: false,
        expiresAt: { $gte: new Date() },
      },
    },
    {
      $group: {
        _id: '$bazarId',
        avgPrice: { $avg: '$price' },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'bazars',
        localField: '_id',
        foreignField: '_id',
        as: 'bazar',
      },
    },
    { $unwind: '$bazar' },
    {
      $project: {
        bazarId: '$_id',
        name: '$bazar.name',
        nameBn: '$bazar.nameBn',
        lat: '$bazar.lat',
        lng: '$bazar.lng',
        area: '$bazar.area',
        avgPrice: { $round: ['$avgPrice', 2] },
        submissionCount: '$count',
      },
    },
  ]);

  return prices;
};

const getPriceHistory = async (productId: string, bazarId?: string) => {
  const matchStage: any = {
    productId: new (require('mongoose').Types.ObjectId)(productId),
  };
  if (bazarId) {
    matchStage.bazarId = new (require('mongoose').Types.ObjectId)(bazarId);
  }

  const history = await Price.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          bazarId: '$bazarId',
        },
        avgPrice: { $avg: '$price' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.date': 1 } },
    {
      $project: {
        date: '$_id.date',
        bazarId: '$_id.bazarId',
        avgPrice: { $round: ['$avgPrice', 2] },
        count: 1,
      },
    },
  ]);

  return history;
};

export {
  createPrice,
  queryPrices,
  getPriceById,
  updatePriceById,
  deletePriceById,
  votePrice,
  markStockOut,
  getBasketSummary,
  getHeatmapData,
  getPriceHistory,
};
