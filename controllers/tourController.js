const multer = require('multer');
const sharp = require('sharp');

const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');

//for temp saving to memory before manipulating file (buffer)
const multerStorage = multer.memoryStorage();

// upload.single('image') req.file
// upload.array('images', 5) req.files
// upload.fields([{option1: 'option1'}]) req.files

const multerFilter = (req, file, callback) => {
  if (file.mimetype.startsWith('image')) {
    callback(null, true);
  } else {
    callback(
      new AppError('Not a valid file type, please upload only images', 400),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  //process cover image
  //make dynamic file name
  //because we're using a factory function, need to add file name to req.body
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  //file is kept in memory before editing (buffer)
  await sharp(req.files.imageCover[0].buffer)
    //3 x 2 ratio
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  //process other images (array)
  req.body.images = [];

  //need to put async outside forEach loop, because it will not actually be async otherwise, using MAP instead with promise.all
  await Promise.all(
    req.files.images.map(async (file, ind) => {
      const fileName = `tour-${req.params.id}-${Date.now()}-${ind + 1}.jpeg`;

      await sharp(file.buffer)
        //3 x 2 ratio
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${fileName}`);

      req.body.images.push(fileName);
    })
  );

  next();
});

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, {
  path: 'reviews',
});
exports.addTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.aliasCheapTours = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'price,-ratingsAverage';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

//aggregation
//using default try/catch blocks instead of custom async function
exports.getTourStats = async (req, res) => {
  try {
    //pass array of stages
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: { $toUpper: '$difficulty' },
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      { $sort: { avgPrice: 1 } },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        stats: stats,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      results: 'Invalid request',
      error: err.message,
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([
      { $unwind: '$startDates' },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: {
          month: {
            $arrayElemAt: [
              // eslint-disable-next-line no-sparse-arrays
              [
                ,
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec',
              ],
              '$_id',
            ],
          },
        },
      },
      {
        //show/hide certain fields
        $project: { _id: 1, numTourStarts: 1, tours: 1, month: 1 },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats: plan,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      results: 'Invalid request',
      error: err.message,
    });
  }
};

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;

  const [lat, lng] = latlng.split(',');
  //need to convert to radians
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(),
      "Please provide latitude and longitude in the format: 'lat, 'lng'"
    );
  }

  // console.log(distance, lat, lng, unit);

  const tours = await Tour.find({
    //getJson coord pairs are backwards (vs lat/long)
    startLocation: {
      $geoWithin: { $centerSphere: [[lng, lat], radius] },
    },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;

  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    next(
      new AppError(),
      "Please provide latitude and longitude in the format: 'lat, 'lng'"
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: unit === 'mi' ? 0.000621371 : 0.001,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
