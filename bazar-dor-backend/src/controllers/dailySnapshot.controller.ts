import { Request, Response } from 'express';
import httpStatus from 'http-status';
import response from '../config/response';
import catchAsync from '../utils/catchAsync';
import * as snapshotService from '../services/dailySnapshot.service';

export const getSnapshots = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
  const data = await snapshotService.getSnapshots(startDate, endDate);
  res.status(httpStatus.OK).json(
    response({ message: 'Snapshots retrieved', status: 'OK', statusCode: httpStatus.OK, data }),
  );
});

export const getSnapshotByDate = catchAsync(async (req: Request, res: Response) => {
  const date = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date;
  const data = await snapshotService.getSnapshotByDate(date);
  res.status(httpStatus.OK).json(
    response({ message: 'Snapshot retrieved', status: 'OK', statusCode: httpStatus.OK, data }),
  );
});

// Admin-only: manually trigger today's snapshot
export const triggerSnapshot = catchAsync(async (req: Request, res: Response) => {
  await snapshotService.triggerTodaySnapshot();
  res.status(httpStatus.OK).json(
    response({ message: 'Snapshot generated successfully', status: 'OK', statusCode: httpStatus.OK, data: null }),
  );
});
