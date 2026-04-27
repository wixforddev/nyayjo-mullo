import { Request, Response } from "express";
import httpStatus from "http-status";
import response from "../config/response";
import { userService } from "../services";
import { Price } from "../models";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import pick from "../utils/pick";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).json(
    response({
      message: "User Created",
      status: "OK",
      statusCode: httpStatus.CREATED,
      data: user,
    }),
  );
});

const getUsers = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ["name", "role", "gender"]);
  const options: any = pick(req.query, ["sortBy", "limit", "page"]);
  options.limit = parseInt(options.limit as string) || 10;
  options.page = parseInt(options.page as string) || 1;
  const result = await userService.queryUsers(filter, options);
  res.status(httpStatus.OK).json(
    response({
      message: "All Users",
      status: "OK",
      statusCode: httpStatus.OK,
      data: result,
    }),
  );
});

const getUser = catchAsync(async (req: Request, res: Response) => {
  const userId = Array.isArray(req.params.userId)
    ? req.params.userId[0]
    : req.params.userId;
  let user = await userService.getUserById(userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  res.status(httpStatus.OK).json(
    response({
      message: "User",
      status: "OK",
      statusCode: httpStatus.OK,
      data: { user },
    }),
  );
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const userId = Array.isArray(req.params.userId)
    ? req.params.userId[0]
    : req.params.userId;
  const image: any = {};
  if ((req as any).file) {
    image.url = "/uploads/users/" + (req as any).file.filename;
    image.path = (req as any).file.path;
  }
  if ((req as any).file) {
    req.body.image = image;
  }

  const user = await userService.updateUserById(userId, req.body);

  res.status(httpStatus.OK).json(
    response({
      message: "User Updated",
      status: "OK",
      statusCode: httpStatus.OK,
      data: user,
    }),
  );
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const userId = Array.isArray(req.params.userId)
    ? req.params.userId[0]
    : req.params.userId;
  await userService.deleteUserById(userId);
  res.status(httpStatus.OK).json(
    response({
      message: "User Deleted",
      status: "OK",
      statusCode: httpStatus.OK,
      data: {},
    }),
  );
});

const getMyStats = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;

  const totalSubmissions = await Price.countDocuments({ userId });
  const verifiedSubmissions = await Price.countDocuments({ userId, isVerified: true });
  const recentPrices = await Price.find({ userId })
    .populate('productId', 'name nameBn icon unit')
    .populate('bazarId', 'name nameBn area')
    .sort({ createdAt: -1 })
    .limit(5);

  res.status(httpStatus.OK).json(
    response({
      message: "User stats retrieved",
      status: "OK",
      statusCode: httpStatus.OK,
      data: {
        totalSubmissions,
        verifiedSubmissions,
        recentPrices,
      },
    }),
  );
});

const getLeaderboard = catchAsync(async (req: Request, res: Response) => {
  const leaderboard = await Price.aggregate([
    {
      $group: {
        _id: '$userId',
        totalSubmissions: { $sum: 1 },
        verifiedSubmissions: { $sum: { $cond: ['$isVerified', 1, 0] } },
      },
    },
    { $sort: { verifiedSubmissions: -1, totalSubmissions: -1 } },
    { $limit: 50 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: '$_id',
        name: '$user.fullName',
        totalSubmissions: 1,
        verifiedSubmissions: 1,
        location: '$user.location',
      },
    },
  ]);

  res.status(httpStatus.OK).json(
    response({
      message: "Leaderboard retrieved",
      status: "OK",
      statusCode: httpStatus.OK,
      data: leaderboard,
    }),
  );
});

export { createUser, deleteUser, getUser, getUsers, updateUser, getMyStats, getLeaderboard };
