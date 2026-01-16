import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String }, // Snapshot of name
    fileId: { type: mongoose.Schema.Types.ObjectId }, // GridFS file ID
    fileUrl: { type: String, required: true },
    originalFileName: { type: String }, // Added for better display
    fileSize: { type: Number }, // Added for display
    fileType: { type: String }, // Added for display
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, default: 'SUBMITTED' }, // 'SUBMITTED', 'GRADED'
    grade: { type: Number, default: null },
    feedback: { type: String, default: '' },
    gradedAt: { type: Date }, // Added for tracking
    code: { type: String }, // Stored code
    language: { type: String }, // Stored language
    output: { type: String }, // Execution output
  },
  { timestamps: true }
);

submissionSchema.index({ taskId: 1, studentId: 1 }, { unique: true });
submissionSchema.index({ taskId: 1, submittedAt: -1 });
submissionSchema.index({ studentId: 1, submittedAt: -1 });

submissionSchema.virtual('id').get(function(){ return this._id.toHexString(); });
submissionSchema.set('toJSON', { virtuals: true, transform: function (doc, ret) { delete ret._id; delete ret.__v; } });

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
