import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import moment from "moment";
import config from "../config/config";
import { tokenTypes } from "../config/tokens";
import { Token } from "../models";
import ApiError from "../utils/ApiError";
import { getUserByEmail } from "./user.service";

interface TokenPayload {
  sub: string;
  iat: number;
  exp: number;
  activity?: string;
  type: string;
}

const generateToken = (
  activityId: string | undefined,
  userId: string,
  expires: number,
  type: string,
  secret = config.jwt.secret,
) => {
  const payload: TokenPayload = {
    sub: userId,
    iat: moment().unix(),
    exp: moment().add(expires, "seconds").unix(),
    activity: activityId,
    type,
  };

  return jwt.sign(payload, secret);
};

const saveToken = async (
  token: string,
  userId: string,
  expires: moment.Moment,
  type: string,
  blacklisted = false,
) => {
  const tokenDoc = await Token.create({
    token,
    user: userId,
    expires: expires.toDate(),
    type,
    blacklisted,
  });
  return tokenDoc;
};

const verifyToken = async (token: string, type: string) => {
  const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;
  const tokenDoc = await Token.findOne({
    token,
    type,
    user: payload.sub,
    blacklisted: false,
  });
  if (!tokenDoc) {
    throw new Error("Token not found");
  }
  return tokenDoc;
};

interface AuthTokens {
  access: {
    token: string;
    expires: Date;
  };
}

const generateAuthTokens = async (
  user: any,
  activityId?: string,
): Promise<AuthTokens> => {
  const accessTokenExpiresSeconds = config.jwt.accessExpirationMinutes * 60;
  const accessToken = generateToken(
    activityId,
    user.id,
    accessTokenExpiresSeconds,
    tokenTypes.ACCESS,
  );

  return {
    access: {
      token: accessToken,
      expires: moment()
        .add(config.jwt.accessExpirationMinutes, "minutes")
        .toDate(),
    },
  };
};

const generateResetPasswordToken = async (email: string) => {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "No users found with this email");
  }
  const expiresSeconds = config.jwt.resetPasswordExpirationMinutes * 60;
  const resetPasswordToken = generateToken(
    user.id,
    user.id,
    expiresSeconds,
    tokenTypes.RESET_PASSWORD,
  );
  const expires = moment().add(
    config.jwt.resetPasswordExpirationMinutes,
    "minutes",
  );
  await saveToken(
    resetPasswordToken,
    user.id,
    expires,
    tokenTypes.RESET_PASSWORD,
  );
  return resetPasswordToken;
};

const generateVerifyEmailToken = async (user: any) => {
  const expiresSeconds = config.jwt.verifyEmailExpirationMinutes * 60;
  const expires = moment().add(
    config.jwt.verifyEmailExpirationMinutes,
    "minutes",
  );
  const verifyEmailToken = generateToken(
    undefined,
    user.id,
    expiresSeconds,
    tokenTypes.VERIFY_EMAIL,
  );
  await saveToken(verifyEmailToken, user.id, expires, tokenTypes.VERIFY_EMAIL);
  return verifyEmailToken;
};

export {
  AuthTokens,
  generateAuthTokens,
  generateResetPasswordToken,
  generateToken,
  generateVerifyEmailToken,
  saveToken,
  verifyToken,
};
