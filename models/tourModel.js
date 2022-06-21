/* eslint-disable prefer-arrow-callback */
const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

// const User = require('./userModel'); only needed for embedding

//this is a 'SCHEMA'
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour name is required'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have at most 40 characters'],
      minlength: [10, 'A tour name must have at least 10 characters'],
      validate: {
        validator: function (value) {
          return validator.isAlpha(value, ['en-US'], { ignore: ' ' });
        },
        message: 'A tour name must only contain letters',
      },
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, 'Tours must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Tours must have a max group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty must be chosen'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be easy, medium, or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 5,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'Tours must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (value) {
          //"THIS" points to the create object
          //"THIS" only points to current doc on creation
          return value < this.price; //returns a boolean
        },
        message: `Discount ({VALUE}) should be less than regular price`,
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour summary is required'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'Tours must have a cover image'],
    },
    images: {
      //an array of strings
      type: [String],
    },
    createdAt: {
      type: Date,
      //mongoDB autmatically coverts date to something readable
      default: Date.now,
      //hides this field from queries
      select: false,
    },
    startDates: {
      //array of dates
      type: [Date],
    },
    startLocation: {
      //mongoDB uses "geoJSON"
      //this object will be an embedded object, so subfields will get options
      type: {
        type: String,
        default: 'Point', //type of geometry (point, geometry, etc)
        enum: ['Point'],
      },
      //geoJSON will be long, lat
      coordinates: [Number],
      address: String,
      description: String,
    },
    //use an array to specify embedded documents
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    //referencing guides that exist, keeep data separate vs embedding
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  //second object is schema options
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//NOTE adding indexes
// "1" ascending, "-1" is decending
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 }); //compound index
tourSchema.index({ slug: 1 });
//for geospacial data, needs to be 2d sphere index
tourSchema.index({ startLocation: '2dsphere' });

//must be regular function to access "this" keyword
//virtual properties are not in database, will be accessable when you "get" data
//virtual properties cannot be used in queries (not in database)
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//virtual populate reviews
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'parentTour',
  localField: '_id',
});

//mongoose middleware (pre, post)
//HEAD document middleware
//save hook: runs before .save() and .create()
//"this" will be the document object
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//HEAD query middleware
//find hook: runs before .find() and .findOne()
//"this" will be the query object
tourSchema.pre(/^find/, function (next) {
  //using a regex to match all find methods
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

//HEAD will run AFTER query is complete
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took: ${Date.now() - this.start} milliseconds`);
  // console.log(docs);
  next();
});

//HEAD aggregation middleware
//"this" will be the aggregation object
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   //to see the aggregation pipeline, must call the pipeline function
//   // console.log(this.pipeline());
//   next();
// });

//HEAD add user object to query
tourSchema.pre(/^find/, function (next) {
  this.populate({ path: 'guides', select: '-__v -passwordChangedAt' });

  next();
});

// //HEAD middleware to get user id and add the reference to the tour (embedding the data)
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));

//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

//model names and variables usually are uppercase
//this is a 'MODEL'
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
