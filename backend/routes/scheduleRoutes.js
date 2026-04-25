const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  generateSchedule,
  getSchedules,
  getSchedule,
  updateSchedule,
  deleteSchedule,
  finalizeSchedule
} = require('../controllers/scheduleController');

// All routes are protected
router.use(protect);

router.post('/generate', generateSchedule);
router.get('/', getSchedules);
router.get('/:id', getSchedule);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);
router.put('/:id/finalize', finalizeSchedule);

module.exports = router;
