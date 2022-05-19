const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.signup = catchAsync(async (req, res, next) => {
  //prevents users from including unwanted data in signup request
  //photos, admin requests, etc.
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  //create new token
  const token = jwt.sign(
    {
      //id from mongo response
      id: newUser._id,
    },
    //secret for the json token
    process.env.JWT_SECRET,
    {
      //how long until the token expires
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  res.status(201).json({
    status: 'success',
    //here is where the token is returned
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  //1 check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  //2 check if user exists & password is valid (could be { email })
  //"select +" explicitly selects a field that was "false" in the user model
  const user = await User.findOne({ email: email }).select('+password');

  console.log(user);

  //3 if good, send token to client
  const token = 'test token';
  res.status(200).json({
    status: 'success',
    token,
  });
};
