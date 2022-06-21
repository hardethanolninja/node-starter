const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.setTourAndUserIds = (req, res, next) => {
  //get tourId from URL
  if (!req.body.tour) req.body.tour = req.params.tourId;
  //get user from protect middleware
  if (!req.body.user) req.body.user = req.user.id;

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
