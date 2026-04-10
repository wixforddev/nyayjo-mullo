import { Request, Response } from "express";
import httpStatus from "http-status";
import response from "../config/response";
import { Service } from "../models";
import { tasksService } from "../services";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import pick from "../utils/pick";

const createTask = catchAsync(async (req: Request, res: Response) => {
  const {
    crewName,
    sessions,
    crewLeaders,
    affiliations,
    location,
    description,
  } = req.body;

  const parsedSession = JSON.parse(sessions);
  const parsedCrewLeaders = JSON.parse(crewLeaders);
  const parsedAffiliations = JSON.parse(affiliations);

  const crewData: any = {
    crewName,
    sessions: parsedSession,
    crewLeaders: parsedCrewLeaders,
    affiliations: parsedAffiliations,
    location,
    description,
  };

  if ((req as any).user) {
    crewData.userId = (req as any).user._id;
  }

  if (!(req as any).file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Image is required");
  }

  if ((req as any).file) {
    crewData.image = {
      url: "/uploads/crews/" + (req as any).file.filename,
      path: (req as any).file.path,
    };
  }

  const crew = await tasksService.createTask(crewData);
  res.status(httpStatus.CREATED).json(
    response({
      message: "Task Created Successfully",
      status: "OK",
      statusCode: httpStatus.CREATED,
      data: crew,
    }),
  );
});

const getTask = catchAsync(async (req: Request, res: Response) => {
  const crewId = Array.isArray(req.params.crewId)
    ? req.params.crewId[0]
    : req.params.crewId;
  const task = await tasksService.getTaskById(crewId);
  res.status(httpStatus.OK).json(
    response({
      message: "Task",
      status: "OK",
      statusCode: httpStatus.OK,
      data: task,
    }),
  );
});

const getTasks = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ["title"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await tasksService.queryTasks(filter, options);
  res.status(httpStatus.OK).json(
    response({
      message: "All Tasks",
      status: "OK",
      statusCode: httpStatus.OK,
      data: result,
    }),
  );
});

const updateTask = catchAsync(async (req: Request, res: Response) => {
  let { crewId } = req.params;
  const finalCrewId = Array.isArray(crewId) ? crewId[0] : crewId;
  const { sessions, crewLeaders, affiliations, ...crewData } = req.body;

  const parsedSessions = JSON.parse(sessions);
  const parsedCrewLeaders = JSON.parse(crewLeaders);
  const parsedAffiliations = JSON.parse(affiliations);

  const updatedCrewData = {
    ...crewData,
    sessions: parsedSessions,
    crewLeaders: parsedCrewLeaders,
    affiliations: parsedAffiliations,
  };

  const image: any = {};
  if ((req as any).file) {
    image.url = "/uploads/crews/" + (req as any).file.filename;
    image.path = (req as any).file.path;
  }

  const updatedTask = await tasksService.updateTaskById(
    finalCrewId,
    updatedCrewData,
    image,
  );

  res.status(httpStatus.OK).json(
    response({
      message: "Task Updated Successfully",
      status: "OK",
      statusCode: httpStatus.OK,
      data: updatedTask,
    }),
  );
});

const deleteTask = catchAsync(async (req: Request, res: Response) => {
  const crewId = Array.isArray(req.params.crewId)
    ? req.params.crewId[0]
    : req.params.crewId;
  const task = await tasksService.deleteTaskById(crewId);
  res.status(httpStatus.OK).json(
    response({
      message: "Task Deleted Successfully",
      status: "OK",
      statusCode: httpStatus.OK,
      data: task,
    }),
  );
});

const homeServiceList = catchAsync(async (req: Request, res: Response) => {
  const service = await Service.find();
  res.status(httpStatus.OK).json(
    response({
      message: "All Tasks",
      status: "OK",
      statusCode: httpStatus.OK,
      data: service,
    }),
  );
});

export {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  homeServiceList,
  updateTask,
};
