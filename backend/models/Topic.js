import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    publishDate: { type: Date, default: Date.now },
    isPublished: { type: Boolean, default: false }, // Added field
    attachments: [String],
  },
  { timestamps: true }
);

topicSchema.index({ isPublished: 1, publishDate: -1 });

topicSchema.virtual('id').get(function(){ return this._id.toHexString(); });
topicSchema.set('toJSON', { virtuals: true, transform: function (doc, ret) { delete ret._id; delete ret.__v; } });

const Topic = mongoose.model('Topic', topicSchema);
export default Topic;
