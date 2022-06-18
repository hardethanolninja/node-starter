//built into express
const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

//create jwt token
const signToken = (id) =>
  jwt.sign(
    {
      id,
    },
    //secret for the json token
    process.env.JWT_SECRET,
    {
      //how long until the token expires
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    //cookie will only be sent over https
    secure: process.env.NODE_ENV === 'production',
    //cookie cannot be accessed/modified by browser
    httpOnly: true,
  });

  //remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  //prevents users from including unwanted data in signup request
  //adding photos, admin requests, etc.
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  createAndSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1 check if email and password exist in the request body
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  //2 check if user exists & password is valid (could be { email })
  //"select +" explicitly selects a field that was "false" in the user model
  const user = await User.findOne({ email: email }).select('+password');

  //checks if password matches hashed db password
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  //3 if good, send token to client
  createAndSendToken(user, 200, res);
});

//middleware to authenticate user for protected routes
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  //1. get token and check if it exists
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    //request header must follow convention of "Bearer token"
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in, please log in to get access', 401)
    );
  }
  //2. if it exists, check if it is valid (verification)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3. if it is valid, check if user exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token does not exist', 401)
    );
  }
  //4. check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again', 401)
    );
  }

  //5. if everything is ok, run next() and grant access to protected route
  req.user = currentUser;
  next();
});

//middleware to restrict access to routes by role
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    //"roles" is an array of roles ['admin', 'lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };

//user reset password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1. Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }

  //2. Generate new token for reset
  const resetToken = user.createPasswordResetToken();
  // no need to save the document for this post request
  await user.save({ validateBeforeSave: false });

  //3. Send reset link to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/reset-password/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\n
  If you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    console.error(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending the email', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1 get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  //wont return if token is invalid or time has passed
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //2 set new password if token is not expired, and user exists
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  //3 update changedPasswordAt field for the user, delete passwordResetToken and passwordResetExpires
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //4 log the user in, send JWT
  createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { passwordCurrent, newPassword, passwordConfirm } = req.body;

  //1. get user from collection
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return next(new AppError('You must be logged in to change password', 401));
  }

  //2. check if POSTed current password is correct
  if (!(await user.correctPassword(passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  //3. update password to new one
  user.password = newPassword;
  user.passwordConfirm = passwordConfirm;
  user.passwordChangedAt = Date.now();
  await user.save();

  //4. log user in, send JWT
  createAndSendToken(user, 200, res);
});
