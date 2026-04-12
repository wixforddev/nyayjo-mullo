import httpStatus from "http-status";
import User from "../models/user.model";
import ApiError from "../utils/ApiError";
import { sendEmailVerification } from "./email.service";

interface UserBody {
  email: string;
  role?: string;
  [key: string]: any;
}

const createUser = async (userBody: UserBody) => {
  const UserModel = User as any;
  if (await UserModel.isEmailTaken(userBody.email, undefined as any)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }
  const oneTimeCode =
    Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

  sendEmailVerification(userBody.email, oneTimeCode);
  console.log(`[OTP] Email: ${userBody.email} | OTP Code: ${oneTimeCode}`);
  return UserModel.create({ ...userBody, oneTimeCode });
};

interface QueryOptions {
  limit?: number;
  page?: number;
  sortBy?: string;
  [key: string]: any;
}

const queryUsers = async (filter: any, options: QueryOptions) => {
  const UserModel = User as any;
  const query: any = {};

  for (const key of Object.keys(filter)) {
    if (
      (key === "fullName" || key === "email" || key === "username") &&
      filter[key] !== ""
    ) {
      query[key] = { $regex: filter[key], $options: "i" };
    } else if (filter[key] !== "") {
      query[key] = filter[key];
    }
  }

  const users = await UserModel.paginate(query, options);

  return users;
};

const getUserById = async (id: string) => {
  return User.findById(id);
};

const getUserByEmail = async (email: string) => {
  return User.findOne({ email });
};

const updateUserById = async (
  userId: string,
  updateBody: any,
  files?: any[],
) => {
  const UserModel = User as any;
  const user = await getUserById(userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (
    updateBody.email &&
    (await UserModel.isEmailTaken(updateBody.email, user._id))
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  if (files && files.length > 0) {
    updateBody.photo = files;
  } else {
    delete updateBody.photo;
  }

  Object.assign(user, updateBody);
  await user.save();
  return user;
};

const deleteUserById = async (userId: string) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  await user.deleteOne();
  return user;
};

const isUpdateUser = async (userId: string, updateBody: any) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const oneTimeCode =
    Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

  sendEmailVerification(updateBody.email, oneTimeCode);
  console.log(`[OTP] Email: ${updateBody.email} | OTP Code: ${oneTimeCode}`);

  Object.assign(user, updateBody, {
    isDeleted: false,
    isSuspended: false,
    isEmailVerified: false,
    isResetPassword: false,
    isPhoneNumberVerified: false,
    oneTimeCode: oneTimeCode,
  });
  await user.save();
  return user;
};

export {
  createUser,
  deleteUserById,
  getUserByEmail,
  getUserById,
  isUpdateUser,
  queryUsers,
  updateUserById,
};
