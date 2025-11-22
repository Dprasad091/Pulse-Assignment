// models/Video.js
const mongoose = require('mongoose');

const qualitySchema = new mongoose.Schema({
  quality: { type: String, enum: ['high','medium','low'], required: true, trim: true },
  path:    { type: String, required: true, trim: true },
  bitrate: { type: Number, default: 0 }
}, { _id: false });

const videoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    validate: { validator: v => mongoose.Types.ObjectId.isValid(v), message: 'Invalid user id' }
  },
  title: { type: String, required: true, trim: true, minlength: 1 },
  description: { type: String, trim: true, default: '' },
  filePath: { type: String, required: true, unique: true, trim: true },
  processedQualities: { type: [qualitySchema], default: [] },
  status: { type: String, enum: ['pending','processing','safe','flagged','failed'], default: 'pending' },
  sensitivity: { type: String, enum: ['unchecked','safe','flagged'], default: 'unchecked' },
  processingProgress: { type: Number, default: 0, min: 0, max: 100 },
  fileSize: { type: Number, default: 0 },
  duration: { type: Number }
}, {
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false },
  toObject: { virtuals: true, versionKey: false }
});

videoSchema.index({ user: 1, status: 1 });

videoSchema.methods.getQualityOrBest = function(requestedQuality) {
  if (!this.processedQualities || this.processedQualities.length === 0) return null;
  const byQuality = this.processedQualities.find(q => q.quality === requestedQuality);
  if (byQuality) return byQuality;
  return this.processedQualities.slice().sort((a,b) => (b.bitrate || 0) - (a.bitrate || 0))[0] || null;
};

module.exports = mongoose.models.Video || mongoose.model('Video', videoSchema);
