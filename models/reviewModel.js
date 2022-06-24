const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
      maxlength: [500, 'Reviews must be less than 500 characters'],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, 'You must leave a rating'],
      min: [1, 'The lowest rating you can leave is 1'],
      max: [5, 'The highest rating you can leave is 5'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

//prevent multiple reviews on same tour by single user
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

//HEAD add tour & user object to query
reviewSchema.pre(/^find/, function (next) {
  //   this.populate({ path: 'parentTour', select: 'name' });
  this.populate({ path: 'user', select: 'name photo' });

  next();
});

//NOTE static method on schema
reviewSchema.statics.calcAvgRatings = async function (tourId) {
  //this keyword will point to current model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        numRating: {
          //for each document, "1" will be added
          $sum: 1,
        },
        avgRating: {
          //pick field to average
          $avg: '$rating',
        },
      },
    },
  ]);

  // console.log('stats:', stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].numRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      //default stats
      ratingsQuantity: 0,
      ratingsAverage: 5,
    });
  }
};

reviewSchema.post('save', function () {
  //first "this" points to the model, second "this" points to the tour being saved
  this.constructor.calcAvgRatings(this.tour);
});

//NOTE no access to document middleware in query, workaround
//findByIdAndUpdate
//findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  //finds doc in database, BEFORE save
  //create property on "this" variable, passes from "pre" middleware to "post" middleware
  this.r = await this.findOne();
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  //query has already exectured at this point, so can't call findOne()
  await this.r.constructor.calcAvgRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
