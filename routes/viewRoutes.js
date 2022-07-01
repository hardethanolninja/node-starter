const express = require('express');

const router = express.Router();

const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

router.get('/', authController.isLoggedIn, viewsController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLogin);
router.get('/sign-up', viewsController.signUp);
router.get('/me', authController.protect, viewsController.getAccount);
router.get(
  '/my-tours',
  authController.protect,
  // no longer needed once hosted
  // bookingController.createBookingCheckout,
  viewsController.getMyTours
);

router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData
);

module.exports = router;
