/** @format */

import { routesHandler } from '../../../helpers/util-generic-functions.js';
import {
  createUser,
  login,
  signup,
  checkEmail,
  getUser,
  logout,
  deleteUser,
  updatePassword,
  forgotPassword,
  resetPassword,
  getAllUsers,
  updateUser,
  RenderResetPassword,
  sendOTP,
  verifyOTP,
  updateFCMTokens
} from '../controller/user.js';
import { upload, prepareAndUpload, fileUpload } from '../../../middleware/fileUploadMiddleware.js';
import { protect } from '../../../middleware/authenticationMiddleware.js';

const userRoutes = (router) => {
  // User Routes
  router.post(`/user/signup`, routesHandler(signup));
  router.post(`/user/login`, routesHandler(login));
  router.post(`/user/logout`, protect, routesHandler(logout));
  router.post(`/user/forgotpassword`, routesHandler(forgotPassword));
  router.get(`/user/resetpassword`, RenderResetPassword);
  router.post(`/user/checkemail`, routesHandler(checkEmail));
  router.post(`/user/resetpassword`, resetPassword);
  router.post(`/user/sendOTP`, routesHandler(sendOTP));
  router.post(`/user/verifyOTP`, routesHandler(verifyOTP));

  // Update profiles
  router.post(`/user/updatepassword`, protect, routesHandler(updatePassword));

  // Users Routes
  router.post(`/user`, fileUpload('fields', [{ name: 'avatar', maxCount: 1 }, { name: 'documents', maxCount: 8 }]), prepareAndUpload, routesHandler(createUser));
  router.get(`/users`, protect, routesHandler(getAllUsers));
  router.get(`/user/:id`, protect, routesHandler(getUser));
  router.put(`/user/:id`, protect, fileUpload('fields', [{ name: 'avatar', maxCount: 1 }, { name: 'documents', maxCount: 8 }]), prepareAndUpload, routesHandler(updateUser));
  router.put(`/fcmToken`, protect, routesHandler(updateFCMTokens));
  router.delete(`/user/:id`, protect, routesHandler(deleteUser));
};

export default userRoutes;
