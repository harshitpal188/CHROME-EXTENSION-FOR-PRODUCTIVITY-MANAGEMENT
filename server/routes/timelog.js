const express = require('express');
const TimeLog = require('../models/TimeLog');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /timelog - Save time log (protected route)
router.post('/timelog', auth, async (req, res) => {
  try {
    const { site, timeSpent, hostname, title, url, date } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!site || !timeSpent || !hostname) {
      return res.status(400).json({
        success: false,
        message: 'Site, timeSpent, and hostname are required'
      });
    }

    // Create time log
    const timeLog = new TimeLog({
      userId,
      site,
      timeSpent,
      hostname,
      title: title || '',
      url: url || '',
      date: date ? new Date(date) : new Date()
    });

    await timeLog.save();

    res.status(201).json({
      success: true,
      message: 'Time log saved successfully',
      data: {
        timeLog: {
          id: timeLog._id,
          site: timeLog.site,
          hostname: timeLog.hostname,
          timeSpent: timeLog.timeSpent,
          date: timeLog.date,
          timeInMinutes: timeLog.getTimeInMinutes(),
          timeInHours: timeLog.getTimeInHours()
        }
      }
    });
  } catch (error) {
    console.error('Time log save error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error saving time log'
    });
  }
});

// GET /report - Get daily/weekly report (protected route)
router.get('/report', auth, async (req, res) => {
  try {
    const { period = 'daily', date } = req.query;
    const userId = req.user._id;

    let reportData;
    const targetDate = date ? new Date(date) : new Date();

    if (period === 'weekly') {
      // Get weekly report
      reportData = await TimeLog.getWeeklySummary(userId, targetDate);
      
      // Calculate weekly totals
      const weeklyTotals = reportData.reduce((acc, site) => {
        acc.totalTime += site.totalTime;
        acc.totalVisits += site.totalVisits;
        return acc;
      }, { totalTime: 0, totalVisits: 0 });

      res.json({
        success: true,
        data: {
          period: 'weekly',
          startDate: targetDate,
          endDate: new Date(targetDate.getTime() + 6 * 24 * 60 * 60 * 1000),
          totals: {
            totalTime: weeklyTotals.totalTime,
            totalVisits: weeklyTotals.totalVisits,
            totalTimeInHours: Math.round((weeklyTotals.totalTime / 3600000) * 100) / 100
          },
          sites: reportData.map(site => ({
            hostname: site._id,
            totalTime: site.totalTime,
            totalVisits: site.totalVisits,
            timeInHours: Math.round((site.totalTime / 3600000) * 100) / 100,
            dailyData: site.dailyData
          }))
        }
      });
    } else {
      // Get daily report (default)
      reportData = await TimeLog.getDailySummary(userId, targetDate);
      
      // Calculate daily totals
      const dailyTotals = reportData.reduce((acc, site) => {
        acc.totalTime += site.totalTime;
        acc.totalVisits += site.totalVisits;
        return acc;
      }, { totalTime: 0, totalVisits: 0 });

      res.json({
        success: true,
        data: {
          period: 'daily',
          date: targetDate.toISOString().split('T')[0],
          totals: {
            totalTime: dailyTotals.totalTime,
            totalVisits: dailyTotals.totalVisits,
            totalTimeInHours: Math.round((dailyTotals.totalTime / 3600000) * 100) / 100
          },
          sites: reportData.map(site => ({
            hostname: site._id,
            totalTime: site.totalTime,
            visits: site.visits,
            timeInHours: Math.round((site.totalTime / 3600000) * 100) / 100,
            sites: site.sites
          }))
        }
      });
    }
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating report'
    });
  }
});

// GET /timelog - Get user's time logs (protected route)
router.get('/timelog', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, hostname, startDate, endDate } = req.query;
    const userId = req.user._id;

    // Build query
    const query = { userId };
    
    if (hostname) {
      query.hostname = hostname;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const timeLogs = await TimeLog.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    // Get total count
    const total = await TimeLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        timeLogs: timeLogs.map(log => ({
          id: log._id,
          site: log.site,
          hostname: log.hostname,
          timeSpent: log.timeSpent,
          date: log.date,
          timeInMinutes: log.getTimeInMinutes(),
          timeInHours: log.getTimeInHours()
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Time logs fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching time logs'
    });
  }
});

// DELETE /timelog/:id - Delete specific time log (protected route)
router.delete('/timelog/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const timeLog = await TimeLog.findOneAndDelete({ _id: id, userId });

    if (!timeLog) {
      return res.status(404).json({
        success: false,
        message: 'Time log not found'
      });
    }

    res.json({
      success: true,
      message: 'Time log deleted successfully'
    });
  } catch (error) {
    console.error('Time log delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting time log'
    });
  }
});

module.exports = router; 