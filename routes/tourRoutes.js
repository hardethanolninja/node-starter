const express = require('express');
const tourController = require('../controllers/tourController');

const router = express.Router();

//parameter middleware (no longer needed)
// router.param('id', tourController.checkId);

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

router.route('/').get(tourController.getAllTours).post(tourController.addTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
