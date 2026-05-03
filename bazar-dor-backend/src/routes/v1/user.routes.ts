import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import * as userValidation from '../../validations/user.validation';
import * as userController from '../../controllers/user.controller';
import fileUpload from '../../middlewares/fileUpload';

const uploadUsers = fileUpload();

const router = express.Router();

router.route('/').get(auth('user'), userController.getUsers);
router.route('/leaderboard').get(userController.getLeaderboard);
router.route('/me/stats').get(auth('common'), userController.getMyStats);

router
  .route('/:userId')
  .get(auth('common'), validate(userValidation.getUser), userController.getUser)
  .patch(auth('common'), uploadUsers.single('image'), userController.updateUser);

export default router;
