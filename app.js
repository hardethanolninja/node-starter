const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

//default convention for using express
const app = express();

//GLOBAL MIDDLEWARE
//HEAD helmet sets security headers (HTTP headers)
app.use(helmet());

//HEAD toggle morgan to use only in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//HEAD middleware body parser for parsing data from request (into req.body) and set post size limit
app.use(express.json({ limit: '10kb' }));

//HEAD middleware to sanitize data -- NoSQL query injection
app.use(mongoSanitize());

//HEAD middleware to sanitize data -- malicious HTML code
app.use(xss());

//HEAD middleware to prevent parameter pollution, object passes whitelist parameters
app.use(
  hpp({
    whitelist: [
      'duration',
      'maxGroupSize',
      'rate',
      'ratingsAverage',
      'ratingsQuantity',
      'price',
    ],
  })
);

//HEAD middleware for serving static files
app.use(express.static(`${__dirname}/public/`));

//HEAD middleware to limit the number of requests (brtueforce, ddos prevention)
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

//HEAD dev troubleshooting middleware
// app.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();

//   console.log('request time', req.requestTime);
//   console.log(req.headers);

//   next();
// });

//import custom routes
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

//import custom error handlers
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

//defined routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

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
