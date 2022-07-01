const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const cors = require('cors');

//default convention for using express
const app = express();

//declare template engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//GLOBAL MIDDLEWARE
//HEAD middleware for serving static files (css, js, images)
app.use(express.static(path.join(__dirname, 'public')));

//HEAD implement CORS
//access-control-allow-origin header added to *
//only for "simple requests" (GET, POST)
//not for PATCH, PUT, DELETE, or req with cookies or nonstandard headers; those require "preflight phase"
app.use(cors());
//NOTE for specific urls
// app.use(
//   cors({
//     origin: 'https://urlIWantToUse.com',
//   })
// );

//HEAD to fix complex requests, use this http method (preflight phase)
app.options('*', cors());
//NOTE for specific urls
// app.options('/api/v1/tours/:id', cors())

//HEAD helmet sets security headers (HTTP headers)
// Further HELMET configuration for Content Security Policy (CSP)
// Source: https://github.com/helmetjs/helmet
const defaultSrcUrls = ['https://js.stripe.com/'];

const scriptSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://cdnjs.cloudflare.com/ajax/libs/axios/1.0.0-alpha.1/axios.min.js',
  'https://js.stripe.com/v3/',
];

const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/',
];

const connectSrcUrls = [
  'https://*.stripe.com',
  'https://unpkg.com',
  'https://tile.openstreetmap.org',
  'https://*.cloudflare.com',
  'http://localhost:3000/api/v1/users/login',
  'http://localhost:3000/api/v1/bookings/checkout-session/',
];

const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", ...defaultSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      connectSrc: ["'self'", ...connectSrcUrls],
      fontSrc: ["'self'", ...fontSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      workerSrc: ["'self'", 'blob:'],
    },
  })
);

//HEAD toggle morgan to use only in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const bookingController = require('./controllers/bookingController');
//this route is top level so that the request will not be converted to json
//HEAD stripe webook
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

//HEAD middleware body parser for parsing data from request (into req.body) and set post size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

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
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

//import custom error handlers
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

//View routes
app.use('/', viewRouter);

//defined API routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

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
