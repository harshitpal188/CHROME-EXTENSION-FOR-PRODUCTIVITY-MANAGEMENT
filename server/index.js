const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage (replace with database later)
const users = new Map();
const timeLogs = new Map();
const JWT_SECRET = 'your-super-secret-jwt-key';

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Helper function to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Productivity Tracker Server is running',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, preferences } = req.body;
    
    if (users.has(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      preferences: preferences || {
        blockedSites: ['facebook.com', 'youtube.com'],
        dailyGoal: 480,
        notifications: true,
        theme: 'auto'
      },
      createdAt: new Date()
    };
    
    users.set(email, user);
    
    const token = generateToken(user.id);
    
    res.json({
      success: true,
      data: {
        user: { ...user, password: undefined },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed' 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = users.get(email);
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    const token = generateToken(user.id);
    
    res.json({
      success: true,
      data: {
        user: { ...user, password: undefined },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed' 
    });
  }
});

app.get('/api/auth/profile', verifyToken, (req, res) => {
  try {
    const user = Array.from(users.values()).find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      data: {
        user: { ...user, password: undefined }
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get profile' 
    });
  }
});

app.put('/api/auth/profile', verifyToken, (req, res) => {
  try {
    const user = Array.from(users.values()).find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const { preferences } = req.body;
    user.preferences = { ...user.preferences, ...preferences };
    users.set(user.email, user);
    
    res.json({
      success: true,
      data: {
        user: { ...user, password: undefined }
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile' 
    });
  }
});

// Time log routes
app.post('/api/timelog', verifyToken, (req, res) => {
  try {
    const { site, hostname, timeSpent, title, url, date } = req.body;
    
    const timeLog = {
      id: Date.now().toString(),
      userId: req.userId,
      site,
      hostname,
      timeSpent,
      title,
      url,
      date: date || new Date().toISOString(),
      createdAt: new Date()
    };
    
    if (!timeLogs.has(req.userId)) {
      timeLogs.set(req.userId, []);
    }
    timeLogs.get(req.userId).push(timeLog);
    
    res.json({
      success: true,
      data: { timeLog }
    });
  } catch (error) {
    console.error('Time log error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save time log' 
    });
  }
});

app.get('/api/report', verifyToken, (req, res) => {
  try {
    const { period = 'daily' } = req.query;
    const userTimeLogs = timeLogs.get(req.userId) || [];
    
    // Filter by period
    const now = new Date();
    let filteredLogs = userTimeLogs;
    
    if (period === 'daily') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filteredLogs = userTimeLogs.filter(log => new Date(log.date) >= today);
    } else if (period === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredLogs = userTimeLogs.filter(log => new Date(log.date) >= weekAgo);
    }
    
    // Group by hostname
    const siteStats = {};
    let totalTime = 0;
    let totalVisits = 0;
    
    filteredLogs.forEach(log => {
      if (!siteStats[log.hostname]) {
        siteStats[log.hostname] = {
          hostname: log.hostname,
          totalTime: 0,
          visits: 0
        };
      }
      siteStats[log.hostname].totalTime += log.timeSpent;
      siteStats[log.hostname].visits += 1;
      totalTime += log.timeSpent;
      totalVisits += 1;
    });
    
    const sites = Object.values(siteStats).sort((a, b) => b.totalTime - a.totalTime);
    
    res.json({
      success: true,
      data: {
        sites,
        totals: {
          totalTime,
          totalVisits,
          totalSites: sites.length
        }
      }
    });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate report' 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Start server
    app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API endpoints available`);
}); 