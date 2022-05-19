const User = require('../models/userModel');

const catchAsync = require('../utils/catchAsync');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const usersData = await User.find();

  //SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: usersData.length,
    data: {
      users: usersData,
    },
  });
});

exports.getUser = (req, res) => {
  res
    .status(500)
    .json({ status: 'error', message: 'This route is not yet defined' });
};
exports.addUser = (req, res) => {
  res
    .status(500)
    .json({ status: 'error', message: 'This route is not yet defined' });
};
exports.updateUser = (req, res) => {
  res
    .status(500)
    .json({ status: 'error', message: 'This route is not yet defined' });
};
exports.deleteUser = (req, res) => {
  res
    .status(500)
    .json({ status: 'error', message: 'This route is not yet defined' });
};
