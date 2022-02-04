class AppError extends Error {
  constructor(message, statusCode) {
    //message is the only parameter that "Error" accepts
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    //boilerplate for constructor
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
