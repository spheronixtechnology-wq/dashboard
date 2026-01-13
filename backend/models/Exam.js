const mongoose = require('mongoose');

const examSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    startTime: { type: Date },
    endTime: { type: Date },
    durationMinutes: { type: Number },
    questions: { type: Array, default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category: { type: String },
    status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'COMPLETED'], default: 'DRAFT' },
  },
  { timestamps: true }
);

examSchema.index({ category: 1, status: 1, createdAt: -1 });

examSchema.virtual('id').get(function(){ return this._id.toHexString(); });
examSchema.set('toJSON', { virtuals: true, transform: function (doc, ret) { delete ret._id; delete ret.__v; } });

module.exports = mongoose.model('Exam', examSchema);
