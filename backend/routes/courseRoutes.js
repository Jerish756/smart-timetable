const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/courseController');

// Course creation validation
const courseValidation = [
  body('name').trim().notEmpty().withMessage('Course name is required'),
  body('code').trim().notEmpty().withMessage('Course code is required'),
  body('totalHours').isInt({ min: 1, max: 20 }).withMessage('Total hours must be between 1 and 20'),
  body('sessionsPerWeek').isInt({ min: 1, max: 10 }).withMessage('Sessions per week must be between 1 and 10')
];

// All routes are protected
router.use(protect);

router.route('/')
  .get(getCourses)
  .post(courseValidation, createCourse);

router.route('/:id')
  .get(getCourse)
  .put(updateCourse)
  .delete(deleteCourse);

module.exports = router;
