const mongoose = require('mongoose');

const attendanceSchema = mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    loginTime: { type: Date },
    lastActiveTime: { type: Date },
    logoutTime: { type: Date },
    totalActiveMinutes: { type: Number, default: 0 },
    status: { type: String, enum: ['PRESENT', 'ABSENT'], default: 'ABSENT' }
  },
  { timestamps: true }
);

attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

attendanceSchema.virtual('id').get(function(){ return this._id.toHexString(); });
attendanceSchema.set('toJSON', { virtuals: true, transform: function (doc, ret) { delete ret._id; delete ret.__v; } });

module.exports = mongoose.model('Attendance', attendanceSchema);
