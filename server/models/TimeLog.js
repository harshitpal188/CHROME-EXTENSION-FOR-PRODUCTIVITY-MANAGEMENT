const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  site: {
    type: String,
    required: true,
    trim: true
  },
  timeSpent: {
    type: Number,
    required: true,
    min: 0 // Time in milliseconds
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  hostname: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    trim: true,
    default: ''
  },
  url: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
timeLogSchema.index({ userId: 1, date: 1 });
timeLogSchema.index({ userId: 1, hostname: 1 });

// Virtual for formatted date (YYYY-MM-DD)
timeLogSchema.virtual('dateFormatted').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Method to get time spent in minutes
timeLogSchema.methods.getTimeInMinutes = function() {
  return Math.round(this.timeSpent / 60000);
};

// Method to get time spent in hours
timeLogSchema.methods.getTimeInHours = function() {
  return Math.round((this.timeSpent / 3600000) * 100) / 100;
};

// Static method to get daily summary for a user
timeLogSchema.statics.getDailySummary = async function(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        date: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: '$hostname',
        totalTime: { $sum: '$timeSpent' },
        visits: { $sum: 1 },
        sites: { $addToSet: '$site' }
      }
    },
    {
      $sort: { totalTime: -1 }
    }
  ]);
};

// Static method to get weekly summary for a user
timeLogSchema.statics.getWeeklySummary = async function(userId, startDate) {
  const startOfWeek = new Date(startDate);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startDate);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        date: { $gte: startOfWeek, $lte: endOfWeek }
      }
    },
    {
      $group: {
        _id: {
          hostname: '$hostname',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
        },
        totalTime: { $sum: '$timeSpent' },
        visits: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.hostname',
        dailyData: {
          $push: {
            date: '$_id.date',
            time: '$totalTime',
            visits: '$visits'
          }
        },
        totalTime: { $sum: '$totalTime' },
        totalVisits: { $sum: '$visits' }
      }
    },
    {
      $sort: { totalTime: -1 }
    }
  ]);
};

module.exports = mongoose.model('TimeLog', timeLogSchema); 