import express from 'express';
import validate from '../../middlewares/validate';
import * as authValidation from '../../validations/auth.validation';
import * as authController from '../../controllers/auth.controller';
import auth from '../../middlewares/auth';
import userFileUploadMiddleware from '../../middlewares/fileUpload';

const UPLOADS_FOLDER_USERS = './public/uploads/users';
const uploadUsers = userFileUploadMiddleware(UPLOADS_FOLDER_USERS);

const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/verify-email', validate(authValidation.verifyEmail), authController.verifyEmail);
router.post('/reset-password', validate(authValidation.resetPassword), authController.resetPassword);
router.post('/change-password', auth('common'), validate(authValidation.changePassword), authController.changePassword);
router.post('/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);
router.post('/logout', validate(authValidation.logout), authController.logout);
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);
router.post('/send-verification-email', auth(), authController.sendVerificationEmail);
router.post('/delete-me', auth('user'), validate(authValidation.deleteMe), authController.deleteMe);

export default router;
