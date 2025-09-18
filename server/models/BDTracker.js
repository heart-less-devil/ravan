const mongoose = require('mongoose');

const bdTrackerSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  programPitched: {
    type: String,
    trim: true,
    default: ''
  },
  outreachDates: {
    type: String,
    trim: true,
    default: ''
  },
  contactFunction: {
    type: String,
    trim: true,
    default: ''
  },
  contactPerson: {
    type: String,
    required: true,
    trim: true
  },
  cda: {
    type: String,
    trim: true,
    default: ''
  },
  feedback: {
    type: String,
    trim: true,
    default: ''
  },
  nextSteps: {
    type: String,
    trim: true,
    default: ''
  },
  timelines: {
    type: String,
    trim: true,
    default: ''
  },
  reminders: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'pending'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Create indexes for better performance
bdTrackerSchema.index({ userId: 1, createdAt: -1 });
bdTrackerSchema.index({ projectName: 1 });
bdTrackerSchema.index({ company: 1 });
bdTrackerSchema.index({ status: 1 });

module.exports = mongoose.model('BDTracker', bdTrackerSchema); 