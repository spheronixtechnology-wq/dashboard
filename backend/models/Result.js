import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema(
  {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String },
    answers: { type: Object }, // Map of questionId -> answer
    score: { type: Number, default: 0 },
    isGraded: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

resultSchema.index({ examId: 1, studentId: 1 }, { unique: true });
resultSchema.index({ studentId: 1, submittedAt: -1 });

resultSchema.virtual('id').get(function(){ return this._id.toHexString(); });
resultSchema.set('toJSON', { virtuals: true, transform: function (doc, ret) { delete ret._id; delete ret.__v; } });

const Result = mongoose.model('Result', resultSchema);
export default Result;
