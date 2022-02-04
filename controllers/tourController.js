const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

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

exports.getAllTours = async (req, res) => {
  try {
    //EXECUTE THE QUERY
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const tourData = await features.query;

    //SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: tourData.length,
      data: {
        tours: tourData,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      error: err.message,
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tourData = await Tour.findById(req.params.id);
    //could also try Tour.findOne({_id: req.params.id}) first result
    //or try Tour.find({_id: req.params.}) all results that match

    res.status(200).json({
      status: 'success',
      data: {
        tours: tourData,
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

exports.addTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: `Invalid data sent: ${err.message}`,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(201).json({
      status: 'success',
      data: {
        tour: updatedTour,
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

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      results: 'Invalid request',
      error: err.message,
    });
  }
};

//aggregation
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
