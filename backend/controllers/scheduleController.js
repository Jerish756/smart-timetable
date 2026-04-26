const Schedule = require('../models/Schedule');
const Course = require('../models/Course');

/**
 * ═══════════════════════════════════════════════════
 *  SmartTable AI — Intelligent Timetable Generation
 *  Uses a scoring-based constraint satisfaction algorithm
 * ═══════════════════════════════════════════════════
 */

// Time slot configuration
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIME_SLOTS = [];

// Generate time slots from 07:00 to 21:00 in 30-min increments
for (let h = 7; h < 21; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hour = String(h).padStart(2, '0');
    const min = String(m).padStart(2, '0');
    TIME_SLOTS.push(`${hour}:${min}`);
  }
}

/**
 * Convert "HH:MM" to total minutes from midnight
 */
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convert minutes from midnight to "HH:MM"
 */
function minutesToTime(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Check if two time ranges overlap
 */
function hasOverlap(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

/**
 * Score a potential slot placement (higher = better)
 */
function scoreSlot(day, startMin, endMin, course, existingSlots, preferences) {
  let score = 100;

  // ── Preference-based scoring ──

  // Penalize morning slots if user prefers no mornings
  if (preferences.noMorningClasses && startMin < 600) { // Before 10:00
    score -= 40;
  }

  // Penalize non-evening slots if user wants evenings only
  if (preferences.eveningsOnly && startMin < 1020) { // Before 17:00
    score -= 30;
  }

  // ── Distribution scoring ──

  // Count sessions on this day
  const sameDaySlots = existingSlots.filter(s => s.day === day);
  const sameDaySessions = sameDaySlots.length;

  // Penalize overloading a single day
  if (sameDaySessions >= 3) score -= 20;
  if (sameDaySessions >= 4) score -= 30;

  // Bonus for spreading across days
  const daysUsed = new Set(existingSlots.map(s => s.day));
  if (!daysUsed.has(day) && daysUsed.size < 5) {
    score += 15; // Encourage using new days
  }

  // ── Break time scoring ──

  const breakDuration = preferences.breakDuration || 45;

  for (const slot of sameDaySlots) {
    const gap = Math.min(
      Math.abs(startMin - slot.endMinutes),
      Math.abs(slot.startMinutes - endMin)
    );

    // Penalize if gap is too small (no break)
    if (gap > 0 && gap < breakDuration) {
      score -= 25;
    }

    // Bonus for having a good break between sessions
    if (gap >= breakDuration && gap <= breakDuration + 30) {
      score += 10;
    }
  }

  // ── Time preference scoring ──

  // Prefer mid-morning to early afternoon (cognitive peak)
  if (startMin >= 540 && startMin <= 780) { // 09:00 - 13:00
    score += 10;
  }

  // Slight penalty for very late slots
  if (startMin >= 1080) { // After 18:00
    score -= 10;
  }

  // ── Course priority scoring ──
  score += (course.priority || 5) * 2;

  // ── Preferred time slots bonus ──
  if (course.preferredTimeSlots && course.preferredTimeSlots.length > 0) {
    for (const pref of course.preferredTimeSlots) {
      if (pref.day === day) {
        const prefStart = timeToMinutes(pref.startTime);
        const prefEnd = timeToMinutes(pref.endTime);
        if (startMin >= prefStart && endMin <= prefEnd) {
          score += 30; // Big bonus for matching preferred slot
        }
      }
    }
  }

  // ── Intensity-based scoring ──
  if (preferences.scheduleIntensity === 'compressed') {
    // Prefer packing sessions close together
    if (sameDaySessions > 0) {
      const lastSlot = sameDaySlots[sameDaySlots.length - 1];
      if (startMin - lastSlot.endMinutes <= 60) {
        score += 15;
      }
    }
  } else if (preferences.scheduleIntensity === 'distributed') {
    // Prefer spreading sessions out
    if (sameDaySessions === 0) {
      score += 20;
    }
  }

  return score;
}

/**
 * Generate an optimized timetable using greedy best-fit algorithm
 */
function generateOptimizedTimetable(courses, preferences) {
  const slots = [];

  // Sort courses by priority (highest first) then by total hours (most first)
  const sortedCourses = [...courses].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return b.totalHours - a.totalHours;
  });

  for (const course of sortedCourses) {
    const sessionsNeeded = course.sessionsPerWeek;
    const durationMinutes = course.sessionDuration || 60;
    let sessionsPlaced = 0;

    // Track which days this course has been placed on
    const courseDays = new Set();

    for (let attempt = 0; attempt < sessionsNeeded; attempt++) {
      let bestScore = -Infinity;
      let bestSlot = null;

      // Determine available days
      let availableDays = [...DAYS];

      for (const day of availableDays) {
        // Try to avoid placing same course on same day (unless compressed)
        if (courseDays.has(day) && preferences.scheduleIntensity !== 'compressed') {
          continue;
        }

        // Determine start time range from preferences
        const wakeMin = timeToMinutes(preferences.wakeTime || '07:00');
        const sleepMin = timeToMinutes(preferences.sleepTime || '22:00');
        
        let minStart = wakeMin; 
        let maxStart = sleepMin - durationMinutes; 

        if (preferences.noMorningClasses) {
          minStart = Math.max(minStart, 600); // 10:00
        }
        if (preferences.eveningsOnly) {
          minStart = Math.max(minStart, 1020); // 17:00
        }

        // Try each 30-minute slot
        for (let startMin = minStart; startMin <= maxStart; startMin += 30) {
          const endMin = startMin + durationMinutes;

          // Check for busy window overlap
          if (preferences.isBusyDuringDay) {
            const busyStart = timeToMinutes(preferences.busyFrom || '09:00');
            const busyEnd = timeToMinutes(preferences.busyTill || '17:00');
            
            if (hasOverlap(startMin, endMin, busyStart, busyEnd)) {
              continue; // Skip this slot as it overlaps with busy hours
            }
          }

          // Check for conflicts with existing slots
          let conflict = slots.some(s =>
            s.day === day && hasOverlap(startMin, endMin, s.startMinutes, s.endMinutes)
          );

          if (conflict) continue;

          // Score this placement
          const score = scoreSlot(day, startMin, endMin, course, slots, preferences);

          if (score > bestScore) {
            bestScore = score;
            bestSlot = {
              courseId: course._id,
              courseName: course.name,
              courseCode: course.code,
              instructor: course.instructor,
              room: course.room,
              type: course.type,
              color: course.color,
              day,
              startTime: minutesToTime(startMin),
              endTime: minutesToTime(endMin),
              startMinutes: startMin,
              endMinutes: endMin
            };
          }
        }
      }

      // If no slot found on unused days, try used days too
      if (!bestSlot) {
        for (const day of availableDays) {
          let minStart = 420;
          let maxStart = 1260 - durationMinutes;
          if (preferences.noMorningClasses) minStart = 600;
          if (preferences.eveningsOnly) minStart = 1020;

          for (let startMin = minStart; startMin <= maxStart; startMin += 30) {
            const endMin = startMin + durationMinutes;
            let conflict = slots.some(s =>
              s.day === day && hasOverlap(startMin, endMin, s.startMinutes, s.endMinutes)
            );
            if (!conflict && preferences.isBusyDuringDay && preferences.busyFrom && preferences.busyTill) {
              const busyStart = timeToMinutes(preferences.busyFrom);
              const busyEnd = timeToMinutes(preferences.busyTill);
              if (hasOverlap(startMin, endMin, busyStart, busyEnd)) {
                conflict = true;
              }
            }
            if (conflict) continue;

            const score = scoreSlot(day, startMin, endMin, course, slots, preferences);
            if (score > bestScore) {
              bestScore = score;
              bestSlot = {
                courseId: course._id,
                courseName: course.name,
                courseCode: course.code,
                instructor: course.instructor,
                room: course.room,
                type: course.type,
                color: course.color,
                day,
                startTime: minutesToTime(startMin),
                endTime: minutesToTime(endMin),
                startMinutes: startMin,
                endMinutes: endMin
              };
            }
          }
        }
      }

      if (bestSlot) {
        slots.push(bestSlot);
        courseDays.add(bestSlot.day);
        sessionsPlaced++;
      }
    }
  }

  return slots;
}

/**
 * Calculate schedule statistics
 */
function calculateStats(slots) {
  const daysUsed = new Set(slots.map(s => s.day));
  const totalMinutes = slots.reduce((sum, s) => sum + (s.endMinutes - s.startMinutes), 0);

  const dayHours = {};
  for (const slot of slots) {
    dayHours[slot.day] = (dayHours[slot.day] || 0) + (slot.endMinutes - slot.startMinutes) / 60;
  }

  let longestDay = '';
  let maxHours = 0;
  for (const [day, hours] of Object.entries(dayHours)) {
    if (hours > maxHours) {
      maxHours = hours;
      longestDay = day;
    }
  }

  return {
    totalHours: Math.round(totalMinutes / 60 * 10) / 10,
    totalSessions: slots.length,
    daysUsed: daysUsed.size,
    averagePerDay: daysUsed.size > 0 ? Math.round(totalMinutes / 60 / daysUsed.size * 10) / 10 : 0,
    longestDay: longestDay.charAt(0).toUpperCase() + longestDay.slice(1),
    conflicts: 0
  };
}

/**
 * Calculate schedule quality score (0-100)
 */
function calculateScore(slots, preferences) {
  let score = 100;

  // Deduct for having too many sessions on one day
  const dayCounts = {};
  for (const slot of slots) {
    dayCounts[slot.day] = (dayCounts[slot.day] || 0) + 1;
  }
  const maxPerDay = Math.max(...Object.values(dayCounts), 0);
  if (maxPerDay > 4) score -= (maxPerDay - 4) * 10;

  // Bonus for good distribution
  const daysUsed = Object.keys(dayCounts).length;
  if (daysUsed >= 4) score += 5;

  // Check break compliance
  const breakDuration = preferences.breakDuration || 45;
  for (const day of DAYS) {
    const daySlots = slots
      .filter(s => s.day === day)
      .sort((a, b) => a.startMinutes - b.startMinutes);

    for (let i = 1; i < daySlots.length; i++) {
      const gap = daySlots[i].startMinutes - daySlots[i - 1].endMinutes;
      if (gap < breakDuration && gap > 0) {
        score -= 5;
      }
    }
  }

  return Math.max(0, Math.min(100, score));
}


// ═══════════════════════════════
//  Controller Methods
// ═══════════════════════════════

/**
 * @desc    Generate an optimized timetable
 * @route   POST /api/schedules/generate
 * @access  Private
 */
exports.generateSchedule = async (req, res, next) => {
  try {
    const { title, semester, preferences: reqPreferences } = req.body;

    // Get user's courses
    const courses = await Course.find({ user: req.user.id, isActive: true });

    if (courses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active courses found. Please add courses first.'
      });
    }

    // Merge user preferences with request preferences
    const user = req.user;
    const preferences = {
      noMorningClasses: reqPreferences?.noMorningClasses ?? user.preferences?.noMorningClasses ?? false,
      eveningsOnly: reqPreferences?.eveningsOnly ?? user.preferences?.eveningsOnly ?? false,
      scheduleIntensity: reqPreferences?.scheduleIntensity ?? user.preferences?.scheduleIntensity ?? 'balanced',
      breakDuration: reqPreferences?.breakDuration ?? user.preferences?.breakDuration ?? 45,
      isBusyDuringDay: reqPreferences?.isBusyDuringDay ?? user.preferences?.isBusyDuringDay ?? false,
      busyFrom: reqPreferences?.busyFrom ?? user.preferences?.busyFrom ?? '09:00',
      busyTill: reqPreferences?.busyTill ?? user.preferences?.busyTill ?? '17:00'
    };

    // Generate optimized slots
    const slots = generateOptimizedTimetable(courses, preferences);
    const stats = calculateStats(slots);
    const score = calculateScore(slots, preferences);

    // Create schedule document
    const schedule = await Schedule.create({
      user: req.user.id,
      title: title || `Schedule — ${new Date().toLocaleDateString()}`,
      semester: semester || '',
      slots,
      preferences,
      score,
      stats,
      status: 'draft'
    });

    res.status(201).json({
      success: true,
      schedule,
      message: `Schedule generated with ${stats.totalSessions} sessions across ${stats.daysUsed} days. Quality score: ${score}/100`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all schedules for current user
 * @route   GET /api/schedules
 * @access  Private
 */
exports.getSchedules = async (req, res, next) => {
  try {
    const schedules = await Schedule.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: schedules.length,
      schedules
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single schedule
 * @route   GET /api/schedules/:id
 * @access  Private
 */
exports.getSchedule = async (req, res, next) => {
  try {
    const schedule = await Schedule.findOne({ _id: req.params.id, user: req.user.id });
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }
    res.status(200).json({ success: true, schedule });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update schedule
 * @route   PUT /api/schedules/:id
 * @access  Private
 */
exports.updateSchedule = async (req, res, next) => {
  try {
    let schedule = await Schedule.findOne({ _id: req.params.id, user: req.user.id });
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, schedule });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete schedule
 * @route   DELETE /api/schedules/:id
 * @access  Private
 */
exports.deleteSchedule = async (req, res, next) => {
  try {
    const schedule = await Schedule.findOne({ _id: req.params.id, user: req.user.id });
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    await schedule.deleteOne();
    res.status(200).json({ success: true, message: 'Schedule deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Finalize a schedule
 * @route   PUT /api/schedules/:id/finalize
 * @access  Private
 */
exports.finalizeSchedule = async (req, res, next) => {
  try {
    const schedule = await Schedule.findOne({ _id: req.params.id, user: req.user.id });
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    // Archive any existing finalized schedules
    await Schedule.updateMany(
      { user: req.user.id, status: 'finalized', _id: { $ne: schedule._id } },
      { status: 'archived' }
    );

    schedule.status = 'finalized';
    await schedule.save();

    res.status(200).json({ success: true, schedule, message: 'Schedule finalized successfully' });
  } catch (error) {
    next(error);
  }
};
