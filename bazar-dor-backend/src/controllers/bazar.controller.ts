import { Request, Response } from 'express';
import httpStatus from 'http-status';
import response from '../config/response';
import { bazarService } from '../services';
import catchAsync from '../utils/catchAsync';
import pick from '../utils/pick';

const createBazar = catchAsync(async (req: Request, res: Response) => {
  const bazar = await bazarService.createBazar(req.body);
  res.status(httpStatus.CREATED).json(
    response({
      message: 'Bazar created successfully',
      status: 'OK',
      statusCode: httpStatus.CREATED,
      data: bazar,
    }),
  );
});

const getBazars = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['name', 'area', 'city', 'isActive']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await bazarService.queryBazars(filter, options);
  res.status(httpStatus.OK).json(
    response({
      message: 'Bazars retrieved successfully',
      status: 'OK',
      statusCode: httpStatus.OK,
      data: result,
    }),
  );
});

const getBazar = catchAsync(async (req: Request, res: Response) => {
  const bazarId = Array.isArray(req.params.bazarId)
    ? req.params.bazarId[0]
    : req.params.bazarId;
  const bazar = await bazarService.getBazarById(bazarId);
  res.status(httpStatus.OK).json(
    response({
      message: 'Bazar retrieved successfully',
      status: 'OK',
      statusCode: httpStatus.OK,
      data: bazar,
    }),
  );
});

const updateBazar = catchAsync(async (req: Request, res: Response) => {
  const bazarId = Array.isArray(req.params.bazarId)
    ? req.params.bazarId[0]
    : req.params.bazarId;
  const bazar = await bazarService.updateBazarById(bazarId, req.body);
  res.status(httpStatus.OK).json(
    response({
      message: 'Bazar updated successfully',
      status: 'OK',
      statusCode: httpStatus.OK,
      data: bazar,
    }),
  );
});

const deleteBazar = catchAsync(async (req: Request, res: Response) => {
  const bazarId = Array.isArray(req.params.bazarId)
    ? req.params.bazarId[0]
    : req.params.bazarId;
  const bazar = await bazarService.deleteBazarById(bazarId);
  res.status(httpStatus.OK).json(
    response({
      message: 'Bazar deleted successfully',
      status: 'OK',
      statusCode: httpStatus.OK,
      data: bazar,
    }),
  );
});

export { createBazar, getBazars, getBazar, updateBazar, deleteBazar };
