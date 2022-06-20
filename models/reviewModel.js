const mongoose = require('mongoose');

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

//HEAD add tour & user object to query
reviewSchema.pre(/^find/, function (next) {
  //   this.populate({ path: 'parentTour', select: 'name' });
  this.populate({ path: 'parentUser', select: 'name photo' });

  next();
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
