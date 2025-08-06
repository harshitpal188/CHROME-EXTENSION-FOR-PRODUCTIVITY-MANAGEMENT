# Productivity Tracker

A comprehensive productivity tracking system with browser extension and web dashboard.

## Features

- **Browser Extension**: Tracks time spent on websites and blocks distracting sites
- **Web Dashboard**: Detailed reports and analytics
- **Authentication**: User accounts with data synchronization
- **Site Blocking**: Block distracting websites with motivational redirects
- **Real-time Tracking**: Active time tracking with visual indicators

## New Features Added

### 1. Loading Spinners
- Added loading spinners while fetching reports in both popup and dashboard
- Visual feedback during data loading operations

### 2. Logout Functionality
- Added logout button in extension popup
- Added logout button in web dashboard
- Clears authentication data and resets to local-only mode

### 3. Extension Packaging
- Easy packaging script to create distributable extension
- Instructions for loading in Chrome

## Installation

### Prerequisites
- Node.js (v14 or higher)
- Chrome browser

### Setup

1. **Install Dependencies**
   ```bash
   npm run install-deps
   ```

2. **Start Development Servers**
   ```bash
   npm run dev
   ```
   This will start both the client (React app) and server (Node.js API) simultaneously.

3. **Load Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `extension` folder from this project

## Usage

### Browser Extension
1. Click the extension icon to open the popup
2. View your daily and all-time time tracking data
3. Add/remove blocked sites
4. Use the logout button to clear authentication data

### Web Dashboard
1. Visit `http://localhost:5173` (React app)
2. Sign up or log in
3. View detailed reports and analytics
4. Manage blocked sites
5. Use the logout button in the header

## Development

### Project Structure
```
productivity-tracker/
├── client/          # React frontend
├── server/          # Node.js backend
├── extension/       # Chrome extension
├── package.json     # Root package.json
└── README.md        # This file
```

### Available Scripts

- `npm run dev` - Start both client and server in development mode
- `npm run package-extension` - Package the extension for distribution
- `npm run install-deps` - Install dependencies for all projects
- `npm run build` - Build the React app for production
- `npm run start` - Start the production server

### Extension Development

The extension is located in the `extension/` folder and includes:
- `manifest.json` - Extension configuration
- `background.js` - Background service worker
- `popup.html/js` - Extension popup interface
- `content.js` - Content script for page interaction

### Loading the Extension

1. **Development Mode** (recommended for development):
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension` folder

2. **Packaged Extension**:
   ```bash
   npm run package-extension
   ```
   This creates `productivity-tracker-extension.zip` which can be distributed.

## API Endpoints

The backend provides these main endpoints:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/timelog` - Submit time tracking data
- `GET /api/timelog/report` - Get time tracking reports

## Configuration

### Blocked Sites
Default blocked sites include:
- facebook.com
- youtube.com
- twitter.com
- instagram.com
- And many more...

Users can customize their blocked sites through the web dashboard or extension popup.

### Motivational Quotes
The extension shows motivational quotes when blocking distracting sites to encourage productivity.

## Troubleshooting

### Extension Not Loading
- Make sure Developer mode is enabled in Chrome
- Check that all files in the extension folder are present
- Try refreshing the extension in chrome://extensions/

### Authentication Issues
- Clear browser storage and try logging in again
- Check that the backend server is running
- Verify the API endpoints are accessible

### Data Not Syncing
- Ensure you're logged in to sync with the backend
- Check network connectivity
- Verify the backend server is running on the correct port

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 