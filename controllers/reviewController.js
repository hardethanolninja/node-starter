const Review = require('../models/reviewModel');
// const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  const reviewData = await Review.find();

  res.status(200).json({
    status: 'success',
    results: reviewData.length,
    data: {
      reviews: reviewData,
    },
  });
});

exports.addReview = catchAsync(async (req, res) => {
  const newReview = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      review: newReview,
    },
  });
});
