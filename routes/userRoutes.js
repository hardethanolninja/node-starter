const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

//create a user
router.route('/signup').post(authController.signup);

//log in user
router.route('/login').post(authController.login);

//forgot & reset password
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
router.patch(
  '/update-password',
  //so that user object is on request
  authController.protect,
  authController.updatePassword
);

//self user update
router.patch('/update-me', authController.protect, userController.updateMe);
//even though user is not actually deleted, it is made inactive, which is a valid use for the delete method
//no data needs to be passed to this method
router.delete('/delete-me', authController.protect, userController.deleteMe);

//user routes
router.route('/').get(userController.getAllUsers).post(userController.addUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
