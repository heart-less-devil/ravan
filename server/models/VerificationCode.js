const mongoose = require('mongoose');

const verificationCodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Verification code is required'],
    length: [6, 'Code must be exactly 6 digits']
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration time is required'],
    index: { expireAfterSeconds: 0 } // Auto-delete expired documents
  },
  isUsed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create compound index for email and code
verificationCodeSchema.index({ email: 1, code: 1 });

// Method to check if code is expired
verificationCodeSchema.methods.isExpired = function() {
  return Date.now() > this.expiresAt;
};

// Method to mark code as used
verificationCodeSchema.methods.markAsUsed = function() {
  this.isUsed = true;
  return this.save();
};

module.exports = mongoose.model('VerificationCode', verificationCodeSchema); 