# Productivity Tracker Chrome Extension

A Chrome extension that tracks time spent on different websites and stores the data locally.

## Features

- **Automatic Time Tracking**: Tracks time spent on each website automatically
- **Local Storage**: All data is stored locally in your browser
- **Beautiful UI**: Modern, clean interface with gradient design
- **Real-time Updates**: Data updates automatically as you browse
- **Statistics**: Shows total time, number of sites, and most visited site
- **Data Management**: Clear all data with one click

## Installation

1. **Load the Extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top right)
   - Click "Load unpacked"
   - Select the `extension` folder from this project

2. **Start Tracking**:
   - The extension will automatically start tracking when you browse
   - Click the extension icon in your toolbar to view your data

## How It Works

### Background Script (`background.js`)
- Tracks active tab changes
- Records time spent on each website
- Stores data in Chrome's local storage
- Handles tab activation, updates, and removal

### Content Script (`content.js`)
- Runs on every webpage
- Tracks page visibility changes
- Monitors user activity
- Provides additional tracking functionality

### Popup Interface (`popup.html` & `popup.js`)
- Displays time tracking statistics
- Shows list of visited sites with time spent
- Allows data refresh and clearing
- Auto-updates every 30 seconds

## Data Storage

All time tracking data is stored locally in your browser using Chrome's storage API. The data includes:
- Website hostnames (e.g., "google.com", "github.com")
- Total time spent on each site in milliseconds
- No personal data or browsing history is collected

## Privacy

- **Local Only**: All data stays on your device
- **No External Servers**: No data is sent to external services
- **No Personal Data**: Only tracks time spent, not browsing content
- **Easy to Clear**: Clear all data with one click

## Usage

1. **View Your Data**: Click the extension icon to see your time tracking statistics
2. **Refresh Data**: Click "Refresh" to manually update the display
3. **Clear Data**: Click "Clear Data" to remove all tracking data
4. **Browse Normally**: The extension works automatically in the background

## File Structure

```
extension/
├── manifest.json      # Extension configuration
├── background.js      # Service worker for tracking
├── content.js         # Content script for web pages
├── popup.html         # Popup interface
├── popup.js          # Popup functionality
└── README.md         # This file
```

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: 
  - `storage`: For local data storage
  - `tabs`: For tab tracking
  - `activeTab`: For current tab access
- **Content Scripts**: Run on all URLs except Chrome internal pages
- **Service Worker**: Background script for continuous tracking

## Troubleshooting

- **Extension not tracking**: Make sure the extension is enabled in `chrome://extensions/`
- **No data showing**: Try refreshing the popup or restarting Chrome
- **Permission errors**: Check that all required permissions are granted

## Development

To modify the extension:
1. Edit the files in the `extension` folder
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## Browser Compatibility

- Chrome 88+ (Manifest V3 support required)
- Other Chromium-based browsers (Edge, Brave, etc.) 