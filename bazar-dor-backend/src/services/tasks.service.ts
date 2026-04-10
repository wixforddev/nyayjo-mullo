import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { Tasks } from '../models';

const createTask = async (data: any) => {
  const task = await Tasks.create(data);
  return task;
};

const queryTasks = async (filter: any, options: any) => {
  const { limit = 10, page = 1 } = options;

  const count = await Tasks.countDocuments(filter);

  const totalPages = Math.ceil(count / limit);
  const skip = (page - 1) * limit;

  const crews = await Tasks.find(filter);

  const result = {
    data: crews,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages,
    totalResults: count,
  };

  if (!crews || !crews.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No Tasks found');
  }

  return result;
};

const getTaskById = async (id: string) => {
  const task = await Tasks.findById(id)
    .populate('crewLeaders', '_id username image')
    .populate('affiliations', '_id name');
  if (!task) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }
  return task;
};

const deleteTaskById = async (id: string) => {
  const task = await Tasks.findByIdAndDelete(id);
  if (!task) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }
  return task;
};

const updateTaskById = async (id: string, bodyData: any, image?: any) => {
  const task = await getTaskById(id);
  if (!task) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }
  if (image) {
    (task as any).image = image;
  }

  Object.assign(task, bodyData);
  await task.save();
  return task;
};

export { createTask, queryTasks, getTaskById, deleteTaskById, updateTaskById };
