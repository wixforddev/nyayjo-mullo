import { Request, Response } from 'express';
import httpStatus from 'http-status';
import response from '../config/response';
import { alertService } from '../services';
import catchAsync from '../utils/catchAsync';
import pick from '../utils/pick';

const createAlert = catchAsync(async (req: Request, res: Response) => {
  const alertData = {
    ...req.body,
    createdBy: (req as any).user?._id,
  };
  const alert = await alertService.createAlert(alertData);

  // Emit socket event for real-time alert
  const io = (req as any).app.get('io');
  if (io) {
    io.emit('alert:new', {
      alertId: alert._id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      messageBn: alert.messageBn,
    });
  }

  res.status(httpStatus.CREATED).json(
    response({
      message: 'Alert created successfully',
      status: 'OK',
      statusCode: httpStatus.CREATED,
      data: alert,
    }),
  );
});

const getAlerts = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['type', 'severity', 'bazarId', 'productId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await alertService.queryAlerts(filter, options);
  res.status(httpStatus.OK).json(
    response({
      message: 'Alerts retrieved successfully',
      status: 'OK',
      statusCode: httpStatus.OK,
      data: result,
    }),
  );
});

const getAlert = catchAsync(async (req: Request, res: Response) => {
  const alertId = Array.isArray(req.params.alertId)
    ? req.params.alertId[0]
    : req.params.alertId;
  const alert = await alertService.getAlertById(alertId);
  res.status(httpStatus.OK).json(
    response({
      message: 'Alert retrieved successfully',
      status: 'OK',
      statusCode: httpStatus.OK,
      data: alert,
    }),
  );
});

const updateAlert = catchAsync(async (req: Request, res: Response) => {
  const alertId = Array.isArray(req.params.alertId)
    ? req.params.alertId[0]
    : req.params.alertId;
  const alert = await alertService.updateAlertById(alertId, req.body);
  res.status(httpStatus.OK).json(
    response({
      message: 'Alert updated successfully',
      status: 'OK',
      statusCode: httpStatus.OK,
      data: alert,
    }),
  );
});

const deleteAlert = catchAsync(async (req: Request, res: Response) => {
  const alertId = Array.isArray(req.params.alertId)
    ? req.params.alertId[0]
    : req.params.alertId;
  const alert = await alertService.deleteAlertById(alertId);
  res.status(httpStatus.OK).json(
    response({
      message: 'Alert deleted successfully',
      status: 'OK',
      statusCode: httpStatus.OK,
      data: alert,
    }),
  );
});

export { createAlert, getAlerts, getAlert, updateAlert, deleteAlert };
