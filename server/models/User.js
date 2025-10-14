const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['business-development', 'sales', 'marketing', 'executive', 'investor', 'other'],
    default: 'other'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedAt: {
    type: Date,
    default: null
  },
  approvedBy: {
    type: String,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  // Payment and subscription fields
  paymentCompleted: {
    type: Boolean,
    default: false
  },
  currentPlan: {
    type: String,
    enum: ['free', 'monthly', 'annual', 'test', 'daily-12', 'basic', 'premium', 'simple-1', 'basic-yearly', 'premium-yearly'],
    default: 'free'
  },
  currentCredits: {
    type: Number,
    default: 5
  },
  lastCreditRenewal: {
    type: Date
  },
  nextCreditRenewal: {
    type: Date
  },
  lastCreditUsage: {
    type: Date
  },
  creditUsageHistory: [{
    action: {
      type: String,
      default: 'search'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    creditsUsed: {
      type: Number,
      default: 1
    },
    remainingCredits: {
      type: Number
    }
  }],
  subscriptionOnHold: {
    type: Boolean,
    default: false
  },
  subscriptionId: {
    type: String
  },
  subscriptionEndAt: {
    type: Date
  },
  paymentUpdatedAt: {
    type: Date
  },
  // BD Tracker custom column headings
  bdTrackerColumnHeadings: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

// Create index for email for faster queries
userSchema.index({ email: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to get user info without password
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema); 