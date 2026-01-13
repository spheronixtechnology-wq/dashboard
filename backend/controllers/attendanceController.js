const Attendance = require('../models/Attendance');

// @desc    Get attendance history
// @route   GET /api/attendance/:userId
// @access  Private
const getAttendance = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.role === 'STUDENT' && req.user.id !== userId) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const attendance = await Attendance.find({ studentId: userId }).sort({ date: -1 });
    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Heartbeat to update active time
// @route   POST /api/attendance/heartbeat
// @access  Private (Student)
const heartbeat = async (req, res) => {
    try {
        if (req.user.role !== 'STUDENT') {
            return res.status(400).json({ success: false, message: 'Only students track attendance' });
        }

        const today = new Date().toISOString().split('T')[0];
        let attendance = await Attendance.findOne({ 
            studentId: req.user.id, 
            date: today 
        });

        const now = new Date();

        if (!attendance) {
            // Create if missing (e.g. login failed to create, or session resumed)
            attendance = await Attendance.create({
                studentId: req.user.id,
                date: today,
                loginTime: now,
                lastActiveTime: now,
                totalActiveMinutes: 0
            });
        }

        // Calculate minutes since last update (capped at 5 mins to prevent huge jumps from sleep)
        const lastActive = attendance.lastActiveTime ? new Date(attendance.lastActiveTime) : now;
        const diffMs = now - lastActive;
        
        // Use Math.round to handle timer drift (e.g. 59.9s should be 1 min)
        // Only count if at least 30 seconds have passed to avoid spam
        const diffMins = diffMs > 30000 ? Math.min(Math.round(diffMs / 60000), 5) : 0;

        if (diffMins > 0) {
            attendance.totalActiveMinutes += diffMins;
            attendance.lastActiveTime = now;
            
            // Mark PRESENT if > 40 mins
            if (attendance.totalActiveMinutes >= 40) {
                attendance.status = 'PRESENT';
            }
            
            await attendance.save();
        } else if (diffMs > 30000) {
            // Update lastActiveTime even if round(diff) was 0 (e.g. 40s), 
            // but effectively we are discarding <30s increments if we don't accumulate.
            // Better strategy: Don't update lastActiveTime if we didn't add minutes, 
            // so the next heartbeat has a larger diffMs.
            
            // However, to keep "online" status accurate, we might want to update lastActiveTime.
            // But for totalActiveMinutes tracking, we should wait.
            // Let's NOT update lastActiveTime if we haven't added minutes, 
            // UNLESS it's been a long time (e.g. user was idle but not enough to add minute?)
            // Actually, simply relying on the next heartbeat to have a larger diffMs is best.
        }

        res.json({ success: true, data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
  getAttendance,
  heartbeat
};
