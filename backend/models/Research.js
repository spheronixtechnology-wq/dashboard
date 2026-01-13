const mongoose = require('mongoose');

const researchSchema = mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String },
    title: { type: String, required: true },
    abstract: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileId: { type: mongoose.Schema.Types.ObjectId }, // GridFS file ID
    originalFileName: { type: String }, // Original file name
    status: { type: String, default: 'PENDING' },
    instructorFeedback: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

researchSchema.virtual('id').get(function(){ return this._id.toHexString(); });
researchSchema.set('toJSON', { virtuals: true, transform: function (doc, ret) { delete ret._id; delete ret.__v; } });

module.exports = mongoose.model('Research', researchSchema);
