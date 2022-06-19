const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

//options allows access to :tourId from other router
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.addReview
  );

module.exports = router;
