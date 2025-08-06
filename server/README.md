# Productivity Tracker Server

Express.js backend server for the Productivity Tracker Chrome Extension with MongoDB Atlas integration.

## Features

- **User Data Management**: Store and retrieve user productivity data
- **Time Tracking**: Save time spent on different websites
- **Daily Statistics**: Track daily and all-time usage patterns
- **Blocked Sites**: Manage user's blocked site preferences
- **RESTful API**: Clean API endpoints for Chrome extension integration

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

1. Copy the environment example file:
   ```bash
   cp env.example .env
   ```

2. Update the `.env` file with your MongoDB Atlas connection string:
   ```
   MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/productivity-tracker?retryWrites=true&w=majority
   ```

### 3. MongoDB Atlas Setup

1. Create a MongoDB Atlas account at [mongodb.com](https://mongodb.com)
2. Create a new cluster
3. Get your connection string from the cluster
4. Replace the placeholder in your `.env` file

### 4. Start the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check
- **GET** `/health` - Server status

### Authentication
- **POST** `/api/auth/register` - Create new user
- **POST** `/api/auth/login` - Authenticate user
- **GET** `/api/auth/profile` - Get user profile (protected)
- **PUT** `/api/auth/profile` - Update user preferences (protected)

### Time Logging
- **POST** `/api/timelog` - Save time log (protected)
- **GET** `/api/timelog` - Get user's time logs (protected)
- **DELETE** `/api/timelog/:id` - Delete specific time log (protected)

### Reports
- **GET** `/api/report` - Get daily/weekly report (protected)

### Example Usage

```javascript
// Register new user
fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    preferences: {
      blockedSites: ['facebook.com', 'youtube.com'],
      dailyGoal: 480 // 8 hours in minutes
    }
  })
});

// Login
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

// Save time log (with authentication)
fetch('http://localhost:3000/api/timelog', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    site: 'GitHub',
    hostname: 'github.com',
    timeSpent: 300000, // 5 minutes in milliseconds
    title: 'GitHub - Build software better, together',
    url: 'https://github.com'
  })
});

// Get daily report
fetch('http://localhost:3000/api/report?period=daily', {
  headers: { 'Authorization': 'Bearer YOUR_JWT_TOKEN' }
})
.then(response => response.json())
.then(data => console.log(data));

// Get weekly report
fetch('http://localhost:3000/api/report?period=weekly', {
  headers: { 'Authorization': 'Bearer YOUR_JWT_TOKEN' }
})
.then(response => response.json())
.then(data => console.log(data));
```

## Database Schema

### User Model
```javascript
{
  email: String,           // User's email (unique)
  password: String,        // Hashed password
  preferences: {
    blockedSites: [String],  // User's blocked sites
    dailyGoal: Number,       // Daily goal in minutes
    notifications: Boolean,   // Notification preferences
    theme: String            // UI theme preference
  },
  createdAt: Date,         // Account creation date
  updatedAt: Date          // Last update timestamp
}
```

### TimeLog Model
```javascript
{
  userId: ObjectId,        // Reference to User
  site: String,           // Site name
  hostname: String,       // Domain name
  timeSpent: Number,      // Time in milliseconds
  date: Date,            // Date of activity
  title: String,         // Page title
  url: String,           // Full URL
  createdAt: Date        // Log creation timestamp
}
```

## Development

### Project Structure
```
server/
├── index.js          # Main server file
├── package.json      # Dependencies and scripts
├── env.example       # Environment variables template
└── README.md         # This file
```

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (placeholder)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `MONGODB_URI` | MongoDB Atlas connection string | Required |
| `JWT_SECRET` | JWT secret for authentication | Optional |

## Error Handling

The server includes comprehensive error handling:
- Database connection errors
- Invalid request data
- Missing user data
- General server errors

All errors return appropriate HTTP status codes and error messages.

## CORS Configuration

The server is configured with CORS to allow requests from the Chrome extension:
- All origins allowed (configurable for production)
- JSON content type support
- Preflight request handling

## Security Considerations

For production deployment:
1. Use environment variables for sensitive data
2. Implement proper authentication
3. Add rate limiting
4. Use HTTPS
5. Configure CORS for specific origins
6. Add input validation middleware 