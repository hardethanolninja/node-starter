const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

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
