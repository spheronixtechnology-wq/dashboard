import mongoose from 'mongoose';

const mockExamSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    score: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    feedback: { type: String },
    date: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Instructor who added it
  },
  { timestamps: true }
);

mockExamSchema.virtual('id').get(function(){ return this._id.toHexString(); });
mockExamSchema.set('toJSON', { virtuals: true, transform: function (doc, ret) { delete ret._id; delete ret.__v; } });

const MockExam = mongoose.model('MockExam', mockExamSchema);
export default MockExam;
