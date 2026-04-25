const Course = require('../models/Course');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all courses for current user
 * @route   GET /api/courses
 * @access  Private
 */
exports.getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single course
 * @route   GET /api/courses/:id
 * @access  Private
 */
exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, user: req.user.id });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.status(200).json({ success: true, course });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new course
 * @route   POST /api/courses
 * @access  Private
 */
exports.createCourse = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    req.body.user = req.user.id;

    // Auto-assign a color if not provided
    const colors = ['#3B5BF7', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#6366F1'];
    const courseCount = await Course.countDocuments({ user: req.user.id });
    if (!req.body.color) {
      req.body.color = colors[courseCount % colors.length];
    }

    const course = await Course.create(req.body);
    res.status(201).json({ success: true, course });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update course
 * @route   PUT /api/courses/:id
 * @access  Private
 */
exports.updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findOne({ _id: req.params.id, user: req.user.id });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, course });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete course
 * @route   DELETE /api/courses/:id
 * @access  Private
 */
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, user: req.user.id });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    await course.deleteOne();
    res.status(200).json({ success: true, message: 'Course deleted' });
  } catch (error) {
    next(error);
  }
};
