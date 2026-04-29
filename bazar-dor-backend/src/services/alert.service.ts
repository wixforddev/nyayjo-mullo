import httpStatus from 'http-status';
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError';
import { Alert, Price, Product } from '../models';

const SPIKE_THRESHOLD       = 0.30;                    // 30%+ বৃদ্ধি = spike
const DUPLICATE_WINDOW_MS   = 6 * 60 * 60 * 1000;     // একই পণ্যে ৬h এর মধ্যে duplicate alert নয়
const REF_WINDOW_DAYS       = 7;                       // median হিসাব: গত ৭ দিনের দাম
const TODAY_CONFIRM_COUNT   = 2;                       // কমপক্ষে ২ জন আলাদা user confirm করতে হবে
const GLOBAL_BAZAR_COUNT    = 3;                       // ৩+ বাজারে spike হলে → global alert

/**
 * Called after every new price submission.
 * - ২+ user একই পণ্যে spike দাম দিলে alert তৈরি হয়
 * - ১-২ বাজারে spike → bazar-specific alert
 * - ৩+ বাজারে spike → global alert (bazarId = null), পুরনো local alert deactivate হয়
 */
const detectPriceSpike = async (
  productId: string,
  newPrice: number,
  bazarId?: string,
  userId?: string,
): Promise<void> => {
  try {
    const pid         = new mongoose.Types.ObjectId(productId);
    const refCutoff   = new Date(Date.now() - REF_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const todayCutoff = new Date(new Date().setHours(0, 0, 0, 0));
    const dupCutoff   = new Date(Date.now() - DUPLICATE_WINDOW_MS);

    // Step 1 — Reference median (গত ৭ দিন, আজকের দাম বাদে)
    const refPrices = await Price.find({
      productId: pid,
      createdAt: { $gte: refCutoff, $lt: todayCutoff },
      isStockOut: false,
    }).select('price');

    if (refPrices.length < 3) return;

    const sorted = refPrices.map((p: any) => p.price).sort((a: number, b: number) => a - b);
    const mid    = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

    // Step 2 — Spike check
    const changeRatio = (newPrice - median) / median;
    if (changeRatio < SPIKE_THRESHOLD) return;

    const spikeFloor = median * (1 + SPIKE_THRESHOLD);

    // Step 3 — Confirmation: আজকে কতজন আলাদা user spike দাম দিয়েছে?
    const todaySpiked = await Price.find({
      productId: pid,
      createdAt: { $gte: todayCutoff },
      isStockOut: false,
      price: { $gte: spikeFloor },
    }).select('userId bazarId');

    const uniqueUsers = new Set(
      todaySpiked.map((p: any) => p.userId?.toString()).filter(Boolean)
    );
    if (userId) uniqueUsers.add(userId);
    if (uniqueUsers.size < TODAY_CONFIRM_COUNT) return;

    // Step 4 — কতটি আলাদা বাজারে আজকে spike confirmed?
    const uniqueSpikingBazars = new Set(
      todaySpiked.map((p: any) => p.bazarId?.toString()).filter(Boolean)
    );
    if (bazarId) uniqueSpikingBazars.add(bazarId);

    const isGlobal = uniqueSpikingBazars.size >= GLOBAL_BAZAR_COUNT;

    // Step 5 — Duplicate check
    if (isGlobal) {
      // Global alert আগে থেকে আছে কিনা (bazarId: null)
      const existing = await Alert.findOne({
        productId: pid, type: 'price_spike', isActive: true,
        bazarId: null, createdAt: { $gte: dupCutoff },
      });
      if (existing) return;

      // Local alert গুলো deactivate করো (global এ upgrade)
      await Alert.updateMany(
        { productId: pid, type: 'price_spike', isActive: true, bazarId: { $ne: null } },
        { isActive: false },
      );
    } else {
      // Bazar-specific: এই বাজারে আগে alert আছে কিনা
      const bid = bazarId ? new mongoose.Types.ObjectId(bazarId) : null;
      const existing = await Alert.findOne({
        productId: pid, type: 'price_spike', isActive: true,
        bazarId: bid, createdAt: { $gte: dupCutoff },
      });
      if (existing) return;
    }

    // Step 6 — Severity ও message তৈরি
    const pct      = Math.round(changeRatio * 100);
    const severity = pct >= 80 ? 'critical' : pct >= 60 ? 'high' : pct >= 40 ? 'medium' : 'low';

    const product       = await Product.findById(pid).select('name nameBn');
    const productNameBn = (product as any)?.nameBn || (product as any)?.name || 'পণ্যের';
    const productName   = (product as any)?.name || 'Product';

    const locationBn = isGlobal
      ? 'একাধিক বাজারে'
      : ''; // bazar-specific হলে frontend populate করে দেখাবে

    await Alert.create({
      type: 'price_spike',
      severity,
      productId: pid,
      bazarId: isGlobal ? null : (bazarId ? new mongoose.Types.ObjectId(bazarId) : null),
      message: `${productName} price rose ${pct}% (৳${Math.round(median)} → ৳${newPrice})${isGlobal ? ' — across multiple markets' : ''}`,
      messageBn: `${locationBn} ${productNameBn}-এর দাম ${pct}% বৃদ্ধি পেয়েছে (৳${Math.round(median)} → ৳${newPrice})`.trim(),
      isActive: true,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });
  } catch (_) {
    // non-blocking — alert failure must not break price submission
  }
};

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

export { createAlert, queryAlerts, getAlertById, updateAlertById, deleteAlertById, detectPriceSpike };
