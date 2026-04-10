import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import response from '../config/response';
import { authService, userService, tokenService, emailService } from '../services';
import { Request, Response } from 'express';

const register = catchAsync(async (req: Request, res: Response) => {
  const isUser = await userService.getUserByEmail(req.body.email);

  if (isUser && (isUser as any).isEmailVerified === false) {
    const user = await userService.isUpdateUser(isUser.id, req.body);
    const tokens = await tokenService.generateAuthTokens(user);
    res.status(httpStatus.CREATED).json(
      response({
        message: 'Thank you for registering. Please verify your email',
        status: 'OK',
        statusCode: httpStatus.CREATED,
        data: {},
      })
    );
  } else if (isUser && (isUser as any).isDeleted === false) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  } else if (isUser && (isUser as any).isDeleted === true) {
    const user = await userService.isUpdateUser(isUser.id, req.body);
    const tokens = await tokenService.generateAuthTokens(user);
    res.status(httpStatus.CREATED).json(
      response({
        message: 'Thank you for registering. Please verify your email',
        status: 'OK',
        statusCode: httpStatus.CREATED,
        data: {},
      })
    );
  } else {
    const user = await userService.createUser(req.body);
    const tokens = await tokenService.generateAuthTokens(user);

    res.status(httpStatus.CREATED).json(
      response({
        message: 'Thank you for registering. Please verify your email',
        status: 'OK',
        statusCode: httpStatus.CREATED,
        data: {},
      })
    );
  }
});

const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const isUser = await userService.getUserByEmail(email);
  
  if ((isUser as any)?.isDeleted === true) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This Account is Deleted');
  }
  if ((isUser as any)?.isEmailVerified === false) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email not verified');
  }
  if (!isUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
  }
  const user = await authService.loginUserWithEmailAndPassword(email, password);

  setTimeout(async () => {
    try {
      (user as any).oneTimeCode = null;
      (user as any).isResetPassword = false;
      await user.save();
      console.log('oneTimeCode reset to null after 3 minute');
    } catch (error) {
      console.error('Error updating oneTimeCode:', error);
    }
  }, 180000);

  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.OK).json(
    response({
      message: 'Login Successful',
      status: 'OK',
      statusCode: httpStatus.OK,
      data: { user, tokens },
    })
  );
});

const logout = catchAsync(async (req: Request, res: Response) => {
  // await authService.logout(req.body.refreshToken);
  // res.status(httpStatus.OK).send();
});

const refreshTokens = catchAsync(async (req: Request, res: Response) => {
  // const tokens = await authService.refreshAuth(req.body.refreshToken);
  // res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getUserByEmail(req.body.email);
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No users found with this email');
  }
  
  const oneTimeCode = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

  (user as any).oneTimeCode = oneTimeCode;
  (user as any).isResetPassword = true;
  await user.save();

  await emailService.sendResetPasswordEmail(req.body.email, oneTimeCode);
  res.status(httpStatus.OK).json(
    response({
      message: 'Email Sent',
      status: 'OK',
      statusCode: httpStatus.OK,
      data: {},
    })
  );
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.password, req.body.email);
  res.status(httpStatus.OK).json(
    response({
      message: 'Password Reset Successful',
      status: 'OK',
      statusCode: httpStatus.OK,
      data: {},
    })
  );
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  await authService.changePassword((req as any).user, req.body);
  res.status(httpStatus.OK).json(
    response({
      message: 'Password Change Successful',
      status: 'OK',
      statusCode: httpStatus.OK,
      data: {},
    })
  );
});

const sendVerificationEmail = catchAsync(async (req: Request, res: Response) => {
  // const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  // await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  // res.status(httpStatus.OK).send();
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.verifyEmail(req.body, req.query);

  const tokens = await tokenService.generateAuthTokens(user);

  res.status(httpStatus.OK).json(
    response({
      message: 'Email Verified',
      status: 'OK',
      statusCode: httpStatus.OK,
      data: { user, tokens },
    })
  );
});

const deleteMe = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.deleteMe(req.body.password, (req as any).user);
  res.status(httpStatus.OK).json(
    response({
      message: 'Account Deleted',
      status: 'OK',
      statusCode: httpStatus.OK,
      data: { user },
    })
  );
});

export { register, login, logout, refreshTokens, forgotPassword, resetPassword, sendVerificationEmail, verifyEmail, deleteMe, changePassword };
