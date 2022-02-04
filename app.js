const express = require('express');
const morgan = require('morgan');

//default convention for using express
const app = express();

//middleware for handling post request
// console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json());
app.use(express.static('./public/'));

//import custom routes
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

//defined routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//middleware for undefined routes
//put this last, because it will match everything
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server`,
  // });
  const err = new Error(`Can't find ${req.originalUrl} on this server`);
  err.status = 'fail';
  err.statusCode = 404;

  //when passing into "next" express assumes it's an error
  //will skip all other middleware
  next(err);
});

//error handling middleware
//by defining app.use with the four parameters
app.use((err, req, res, next) => {
  //defining defaults
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

module.exports = app;
