const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.setTourAndUserIds = (req, res, next) => {
  //get tourId from URL
  if (!req.body.parentTour) req.body.parentTour = req.params.tourId;
  //get user from protect middleware
  if (!req.body.parentUser) req.body.parentUser = req.user.id;

  next();
};

exports.getReview = factory.getOne(Review);
exports.addReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter;
  if (req.params.tourId) filter = { parentTour: req.params.tourId };

  const reviewData = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    results: reviewData.length,
    data: {
      data: reviewData,
    },
  });
});
