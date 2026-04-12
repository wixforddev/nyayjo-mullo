import Joi from 'joi';
import { password } from './custom.validation';

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    fullName: Joi.string().required(),
    role: Joi.string().valid('user', 'vendor', 'admin').default('user'),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
    email: Joi.string().required(),
  }),
};

const changePassword = {
  body: Joi.object().keys({
    oldPassword: Joi.string().required().custom(password),
    newPassword: Joi.string().required().custom(password),
  }),
};

const verifyEmail = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    oneTimeCode: Joi.string().required(),
  }),
};

const deleteMe = {
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

const sendOTP = {
  body: Joi.object().keys({
    phoneNumber: Joi.string().required(),
  }),
};

const verifyOTP = {
  body: Joi.object().keys({
    phoneNumber: Joi.string().required(),
    otpCode: Joi.string().required(),
  }),
};

export { register, login, logout, refreshTokens, forgotPassword, resetPassword, verifyEmail, deleteMe, changePassword, sendOTP, verifyOTP };
