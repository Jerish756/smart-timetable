const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: false
  },
  courseName: String,
  courseCode: String,
  instructor: String,
  room: String,
  type: String,
  color: String,
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  startMinutes: Number,
  endMinutes: Number
}, { _id: true });

const scheduleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'My Schedule'
  },
  semester: {
    type: String,
    default: ''
  },
  slots: [slotSchema],
  preferences: {
    noMorningClasses: Boolean,
    eveningsOnly: Boolean,
    scheduleIntensity: String,
    breakDuration: Number,
    wakeTime: String,
    sleepTime: String
  },
  score: {
    type: Number,
    default: 0
  },
  stats: {
    totalHours: Number,
    totalSessions: Number,
    daysUsed: Number,
    averagePerDay: Number,
    longestDay: String,
    conflicts: Number
  },
  status: {
    type: String,
    enum: ['draft', 'finalized', 'archived'],
    default: 'draft'
  },
  version: {
    type: String,
    default: 'v1.0'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

scheduleSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

scheduleSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
