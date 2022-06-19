const Review = require('../models/reviewModel');
// const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter;
  if (req.params.tourId) filter = { parentTour: req.params.tourId };

  const reviewData = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    results: reviewData.length,
    data: {
      reviews: reviewData,
    },
  });
});

exports.addReview = catchAsync(async (req, res) => {
  //get tourId from URL
  if (!req.body.parentTour) req.body.parentTour = req.params.tourId;
  //get user from protect middleware
  if (!req.body.parentUser) req.body.parentUser = req.user.id;

  const newReview = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      review: newReview,
    },
  });
});
