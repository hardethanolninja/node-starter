const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(.*?[^\\])\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((ele) => ele.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpired = () =>
  new AppError('Your token expired. Please log in again!', 401);

const sendErrorDev = (err, req, res) => {
  //API response
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    //rendered site response
    res.status(err.statusCode).render('error', {
      title: 'Page not found',
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  //API response
  if (req.originalUrl.startsWith('/api')) {
    //operational trusted error: send message to client
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      //programming or other unknown error: send generic message
    } else {
      //log error to console
      // eslint-disable-next-line no-console
      console.error('💥 ERROR 💥', err);
      //send generic message
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
      });
    }
  } else {
    //rendered site response
    res.status(err.statusCode).render('error', {
      title: 'Page not found',
      msg: 'Page not found',
    });
  }
};

module.exports = (err, req, res, next) => {
  //defining defaults
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let customError = Object.create(err);

    if (customError.name === 'CastError')
      customError = handleCastErrorDB(customError);
    if (customError.code === 11000)
      customError = handleDuplicateFieldsDB(customError);
    if (customError._message === 'Validation failed')
      customError = handleValidationErrorDB(customError);
    if (customError.name === 'JsonWebTokenError')
      customError = handleJWTError();
    if (customError.name === 'TokenExpiredError')
      customError = handleJWTExpired();

    //send the custom errors
    sendErrorProd(customError, req, res);
  }
};
