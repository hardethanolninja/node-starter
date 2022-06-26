const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

//create a user
router.route('/signup').post(authController.signup);

//log in user
router.route('/login').post(authController.login);

//log out user
router.route('/logout').get(authController.logout);

//forgot & reset password
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

//NOTE protect all routes past this point
router.use(authController.protect);

router.patch('/update-password', authController.updatePassword);

//self user update
//upload.single is field in form that will be uploaded, will put file info on request object
router.patch(
  '/update-me',
  userController.uploadPhoto,
  userController.resizePhoto,
  userController.updateMe
);

//even though user is not actually deleted, it is made inactive, which is a valid use for the delete method
//no data needs to be passed to this method
router.delete('/delete-me', userController.deleteMe);

router.get('/me', userController.getMe, userController.getUser);

//NOTE authorize to admins only past this point
router.use(authController.restrictTo('admin'));

//user routes
router.route('/').get(userController.getAllUsers).post(userController.addUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
