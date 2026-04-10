import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import * as userValidation from '../../validations/user.validation';
import * as userController from '../../controllers/user.controller';
import userFileUploadMiddleware from '../../middlewares/fileUpload';
import convertHeicToPngMiddleware from '../../middlewares/converter';

const UPLOADS_FOLDER_USERS = './public/uploads/users';

const uploadUsers = userFileUploadMiddleware(UPLOADS_FOLDER_USERS);

const router = express.Router();

router.route('/').get(auth('user'), userController.getUsers);

router
  .route('/:userId')
  .get(auth('common'), validate(userValidation.getUser), userController.getUser)
  .patch(
    auth('common'),
    [uploadUsers.single('image')],
    convertHeicToPngMiddleware(UPLOADS_FOLDER_USERS),
    userController.updateUser
  );

export default router;
