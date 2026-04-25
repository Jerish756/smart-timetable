const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    trim: true,
    uppercase: true
  },
  instructor: {
    type: String,
    trim: true,
    default: 'TBA'
  },
  type: {
    type: String,
    enum: ['theoretical', 'practical_lab', 'seminar', 'elective', 'tutorial'],
    default: 'theoretical'
  },
  color: {
    type: String,
    default: '#3B5BF7'
  },
  totalHours: {
    type: Number,
    required: [true, 'Total weekly hours required'],
    min: 1,
    max: 20
  },
  sessionsPerWeek: {
    type: Number,
    required: [true, 'Sessions per week required'],
    min: 1,
    max: 10
  },
  sessionDuration: {
    type: Number,
    default: 60,
    min: 30,
    max: 180
  },
  preferredTimeSlots: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    startTime: String,
    endTime: String
  }],
  priority: {
    type: Number,
    default: 5,
    min: 1,
    max: 10
  },
  room: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

courseSchema.index({ user: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);
