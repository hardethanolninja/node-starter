const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

//user routes
router.route('/').get(userController.getAllUsers).post(userController.addUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

//create a user
router.route('/signup').post(authController.signup);

//log in user
router.route('/login').post(authController.login);

module.exports = router;
