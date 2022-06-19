const express = require('express');

const tourController = require('../controllers/tourController');
const reviewRouter = require('./reviewRoutes');
const authController = require('../controllers/authController');

const router = express.Router();

//parameter middleware (no longer needed)
// router.param('id', tourController.checkId);

//send reviews to review router, despite them starting with "tours"
router.use('/:tourId/reviews', reviewRouter);

//aliasing
router
  .route(`/top-5-cheap`)
  .get(tourController.aliasTopTours, tourController.getAllTours);

router
  .route(`/cheap-tours`)
  .get(tourController.aliasCheapTours, tourController.getAllTours);

//stats
router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.addTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    //ensures user is logged in & valid
    authController.protect,
    //roles that are allowed to run this handler function
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
