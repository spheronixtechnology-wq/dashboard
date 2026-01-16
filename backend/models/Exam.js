import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
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

const Exam = mongoose.model('Exam', examSchema);
export default Exam;
