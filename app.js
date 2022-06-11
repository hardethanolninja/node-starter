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

//dev troubleshooting middleware
// app.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();

//   console.log('request time', req.requestTime);
//   console.log(req.headers);

//   next();
// });

//import custom routes
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

//import custom error handlers
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

//defined routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//middleware for undefined routes
//put this last, because it will match everything
app.all('*', (req, res, next) => {
  //when passing into "next" express assumes it's an error
  //will skip all other middleware
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

//error handling middleware
app.use(globalErrorHandler);

module.exports = app;
