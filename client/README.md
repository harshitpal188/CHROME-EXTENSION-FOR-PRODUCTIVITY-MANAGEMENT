# Productivity Tracker - React Client

A modern React application for the Productivity Tracker Chrome Extension dashboard.

## Features

- **Authentication**: Login/Register with JWT tokens
- **Dashboard**: Real-time productivity statistics
- **Time Tracking**: Daily and weekly time breakdowns
- **Blocked Sites**: Manage distracting websites
- **Responsive Design**: Mobile-friendly interface

## Tech Stack

- **React 18** - Frontend framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Tailwind CSS** - Utility-first CSS framework

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Backend server running on `http://localhost:3000`

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable components
│   └── ProtectedRoute.jsx
├── contexts/           # React contexts
│   └── AuthContext.jsx
├── pages/              # Page components
│   ├── AuthPage.jsx
│   └── DashboardPage.jsx
├── services/           # API services
│   └── api.js
├── App.jsx            # Main app component
└── main.jsx           # Entry point
```

## API Integration

The client communicates with the backend server through the following endpoints:

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user preferences

### Time Logging
- `POST /api/timelog` - Save time log
- `GET /api/timelog` - Get time logs
- `DELETE /api/timelog/:id` - Delete time log

### Reports
- `GET /api/report` - Get daily/weekly reports

## Features

### Authentication
- Secure login/register forms
- JWT token management
- Automatic token refresh
- Protected routes

### Dashboard
- Real-time statistics
- Daily and weekly reports
- Time breakdown charts
- Site visit tracking

### Blocked Sites Management
- Add/remove distracting sites
- Real-time updates
- User preference persistence

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3000/api
```

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. The built files will be in the `dist` directory

3. Deploy the `dist` folder to your hosting provider

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
