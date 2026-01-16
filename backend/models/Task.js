import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    deadline: { type: Date, required: true },
    assignedTo: { type: mongoose.Schema.Types.Mixed }, // Can be specific user ID or group
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, required: true }, // 'ASSIGNMENT', 'PROJECT'
    projectCategory: { type: String },
    isPublished: { type: Boolean, default: true }, // Added field, default true for tasks
  },
  { timestamps: true }
);

taskSchema.index({ isPublished: 1, createdAt: -1 });
taskSchema.index({ type: 1, createdAt: -1 });

taskSchema.virtual('id').get(function(){ return this._id.toHexString(); });
taskSchema.set('toJSON', { virtuals: true, transform: function (doc, ret) { delete ret._id; delete ret.__v; } });

const Task = mongoose.model('Task', taskSchema);
export default Task;
