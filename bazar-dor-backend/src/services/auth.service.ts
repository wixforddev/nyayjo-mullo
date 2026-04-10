import httpStatus from "http-status";
import { tokenTypes } from "../config/tokens";
import { Token } from "../models";
import ApiError from "../utils/ApiError";
import * as tokenService from "./token.service";
import * as userService from "./user.service";

const loginUserWithEmailAndPassword = async (
  email: string,
  password: string,
) => {
  const user = await userService?.getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }
  return user;
};

const logout = async (refreshToken: string) => {
  const refreshTokenDoc = await Token.findOne({
    token: refreshToken,
    type: tokenTypes.REFRESH,
    blacklisted: false,
  });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, "Not found");
  }
  await refreshTokenDoc.deleteOne();
};

const refreshAuth = async (refreshToken: string) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(
      refreshToken,
      tokenTypes.REFRESH,
    );
    const user = await userService.getUserById((refreshTokenDoc as any).user);
    if (!user) {
      throw new Error();
    }
    await refreshTokenDoc.deleteOne();
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
  }
};

const resetPassword = async (newPassword: string, email: string) => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  if (await user.isPasswordMatch(newPassword)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "New password cannot be the same as old password",
    );
  }
  await userService.updateUserById(user.id, { password: newPassword });

  return user;
};

const changePassword = async (
  reqUser: any,
  reqBody: { oldPassword: string; newPassword: string },
) => {
  const { oldPassword, newPassword } = reqBody;
  const user = await userService.getUserByEmail(reqUser.email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  if (!(await user.isPasswordMatch(oldPassword))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect password");
  }
  if (await user.isPasswordMatch(newPassword)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "New password cannot be the same as old password",
    );
  }
  (user as any).password = newPassword;
  await user.save();
  return user;
};

const verifyEmail = async (reqBody: any, reqQuery: any) => {
  const { email, oneTimeCode } = reqBody;
  const user = await userService.getUserByEmail(email);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not exist");
  } else if ((user as any).oneTimeCode === null) {
    throw new ApiError(httpStatus.BAD_REQUEST, "OTP expired");
  } else if (oneTimeCode != (user as any).oneTimeCode) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  } else if ((user as any).isEmailVerified && !(user as any).isResetPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already verified");
  } else {
    (user as any).isEmailVerified = true;
    (user as any).oneTimeCode = null;
    (user as any).isResetPassword = false;
    await user.save();
    return user;
  }
};

const verifyNumber = async (
  phoneNumber: string,
  otpCode: string,
  email: string,
) => {
  const user = await userService.getUserByEmail(email);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not exist");
  } else if ((user as any).phoneNumberOTP === null) {
    throw new ApiError(httpStatus.BAD_REQUEST, "OTP expired");
  } else if (otpCode != (user as any).phoneNumberOTP) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  } else if ((user as any).isPhoneNumberVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Phone Number already verified");
  } else {
    (user as any).isPhoneNumberVerified = true;
    (user as any).phoneNumberOTP = null;
    await user.save();
    return user;
  }
};

const deleteMe = async (password: string, reqUser: any) => {
  const user = await userService.getUserByEmail(reqUser.email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  if (!(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect password");
  }
  (user as any).isDeleted = true;
  await user.save();
  return user;
};

export {
  changePassword,
  deleteMe,
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
  verifyNumber,
};
