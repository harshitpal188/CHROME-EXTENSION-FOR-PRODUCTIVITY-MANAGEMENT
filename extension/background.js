// Background service worker for Productivity Tracker
let currentTabId = null;
let startTime = null;
let isTracking = false;
let trackingInterval = null;

// List of distracting sites to block
let blockedSites = [
  'facebook.com',
  'youtube.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'tiktok.com',
  'reddit.com',
  'netflix.com',
  'hulu.com',
  'disneyplus.com',
  'amazon.com/prime',
  'twitch.tv',
  'discord.com',
  'snapchat.com',
  'pinterest.com'
];

// Motivational quotes
const motivationalQuotes = [
  "The only way to do great work is to love what you do. - Steve Jobs",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
  "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
  "The future depends on what you do today. - Mahatma Gandhi",
  "It always seems impossible until it's done. - Nelson Mandela"
];

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Productivity Tracker installed');
  chrome.storage.local.set({ 
    timeData: {},
    todayData: {},
    blockedSites: blockedSites
  });
  initializeTracking();
});

// Handle tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  console.log('Tab activated:', activeInfo.tabId);
  
  // Stop tracking previous tab
  if (isTracking && currentTabId) {
    await stopTracking();
  }
  
  // Start tracking new active tab
  currentTabId = activeInfo.tabId;
  await startTracking();
});

// Handle tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Check for blocked sites
  if (changeInfo.url && tab.url) {
    const hostname = new URL(tab.url).hostname;
    if (isBlockedSite(hostname)) {
      console.log(`Blocking distracting site: ${hostname}`);
      await redirectToMotivationalPage(tabId);
      return;
    }
  }
  
  // Handle tracking
  if (tabId === currentTabId) {
    if (changeInfo.status === 'complete') {
      if (isTracking) {
        await stopTracking();
      }
      await startTracking();
    } else if (changeInfo.url) {
      if (isTracking) {
        await stopTracking();
      }
    }
  }
});

// Handle tab removal
chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (tabId === currentTabId && isTracking) {
    await stopTracking();
    currentTabId = null;
  }
});

// Start tracking
async function startTracking() {
  if (!currentTabId) return;
  
  try {
    const tab = await chrome.tabs.get(currentTabId);
    
    if (tab && tab.url && !isChromeInternalPage(tab.url)) {
      startTime = Date.now();
      isTracking = true;
      console.log(`Started tracking: ${tab.url}`);
      
      // Update badge
      updateBadge(true);
      
      // Start continuous tracking
      if (trackingInterval) {
        clearInterval(trackingInterval);
      }
      
      trackingInterval = setInterval(async () => {
        if (isTracking && startTime) {
          const currentTime = Date.now();
          const timeSpent = currentTime - startTime;
          
          await saveTimeData(tab.url, timeSpent);
          startTime = currentTime;
        }
      }, 5000); // Save every 5 seconds
      
    } else {
      console.log('Skipping tracking for Chrome internal page');
    }
  } catch (error) {
    console.error('Error starting tracking:', error);
    isTracking = false;
  }
}

// Stop tracking
async function stopTracking() {
  if (!isTracking || !startTime) return;
  
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  
  const endTime = Date.now();
  const timeSpent = endTime - startTime;
  
  try {
    const tab = await chrome.tabs.get(currentTabId);
    if (tab && tab.url && !isChromeInternalPage(tab.url)) {
      await saveTimeData(tab.url, timeSpent);
      console.log(`Stopped tracking: ${tab.url}, time spent: ${formatTime(timeSpent)}`);
    }
  } catch (error) {
    console.error('Error stopping tracking:', error);
  }
  
  isTracking = false;
  startTime = null;
  updateBadge(false);
}

// Save time data
async function saveTimeData(url, timeSpent) {
  try {
    const hostname = new URL(url).hostname;
    const today = new Date().toDateString();
    
    // Get existing data
    const data = await chrome.storage.local.get(['timeData', 'todayData']);
    const timeData = data.timeData || {};
    const todayData = data.todayData || {};
    
    // Update all-time data
    if (timeData[hostname]) {
      timeData[hostname] += timeSpent;
    } else {
      timeData[hostname] = timeSpent;
    }
    
    // Update today's data
    if (todayData[hostname]) {
      todayData[hostname] += timeSpent;
    } else {
      todayData[hostname] = timeSpent;
    }
    
    // Save to storage
    await chrome.storage.local.set({ 
      timeData: timeData,
      todayData: todayData
    });
    
    console.log(`Saved time for ${hostname}: ${formatTime(timeData[hostname])}`);
    
    // SYNC WITH BACKEND
    await syncTimeDataToBackend(url, timeSpent, hostname);
    
  } catch (error) {
    console.error('Error saving time data:', error);
  }
}

// Sync time data to backend
async function syncTimeDataToBackend(url, timeSpent, hostname) {
  try {
    // Check if user is logged in
    const authData = await chrome.storage.local.get(['token']);
    const token = authData.token;
    
    if (!token) {
      console.log('No auth token, skipping backend sync');
      return;
    }
    
    // Get tab information
    const tab = await chrome.tabs.get(currentTabId);
    const title = tab?.title || '';
    
    // Prepare time log data
    const timeLogData = {
      site: title || hostname,
      hostname: hostname,
      timeSpent: timeSpent,
      title: title,
      url: url,
      date: new Date().toISOString()
    };
    
    // Send to backend API
    const response = await fetch('http://localhost:3000/api/timelog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(timeLogData)
    });
    
    if (response.ok) {
      console.log('Time data synced to backend successfully');
    } else {
      console.error('Failed to sync to backend:', response.status);
      
      // If token is invalid, remove it
      if (response.status === 401) {
        await chrome.storage.local.remove(['token', 'user']);
        console.log('Auth token expired, removed from storage');
      }
    }
  } catch (error) {
    console.error('Error syncing to backend:', error);
  }
}

// Check if Chrome internal page
function isChromeInternalPage(url) {
  return url.startsWith('chrome://') || 
         url.startsWith('chrome-extension://') || 
         url.startsWith('about:') ||
         url.startsWith('moz-extension://') ||
         url.startsWith('edge://');
}

// Check if site is blocked
function isBlockedSite(hostname) {
  return blockedSites.some(blockedSite => 
    hostname === blockedSite || 
    hostname.endsWith('.' + blockedSite) ||
    hostname.includes(blockedSite)
  );
}

// Redirect to motivational page
async function redirectToMotivationalPage(tabId) {
  try {
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    const motivationalPage = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Stay Focused - Productivity Tracker</title>
          <style>
              body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  margin: 0;
                  padding: 0;
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  text-align: center;
              }
              .container {
                  max-width: 600px;
                  padding: 40px 20px;
                  background: rgba(255, 255, 255, 0.1);
                  border-radius: 20px;
                  backdrop-filter: blur(10px);
                  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
              }
              .icon { font-size: 64px; margin-bottom: 20px; }
              h1 { font-size: 28px; margin-bottom: 20px; font-weight: 600; }
              .quote { font-size: 18px; line-height: 1.6; margin-bottom: 30px; font-style: italic; }
              .message { font-size: 16px; opacity: 0.9; margin-bottom: 30px; }
              .button {
                  background: rgba(255, 255, 255, 0.2);
                  color: white;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 8px;
                  font-size: 16px;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  text-decoration: none;
                  display: inline-block;
                  margin: 5px;
              }
              .button:hover { background: rgba(255, 255, 255, 0.3); transform: translateY(-2px); }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="icon">🎯</div>
              <h1>Stay Focused!</h1>
              <div class="quote">"${randomQuote}"</div>
              <div class="message">
                  This site has been blocked to help you stay productive. 
                  Use this time to work on something meaningful instead.
              </div>
              <a href="https://www.google.com" class="button">Go to Google</a>
              <a href="https://github.com" class="button">Go to GitHub</a>
          </div>
      </body>
      </html>
    `;
    
    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(motivationalPage);
    await chrome.tabs.update(tabId, { url: dataUrl });
    
  } catch (error) {
    console.error('Error redirecting to motivational page:', error);
  }
}

// Update badge
function updateBadge(isTracking) {
  chrome.action.setBadgeText({
    text: isTracking ? '●' : '',
    tabId: currentTabId
  });
  
  chrome.action.setBadgeBackgroundColor({
    color: isTracking ? '#4CAF50' : '#666666',
    tabId: currentTabId
  });
}

// Format time
function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Initialize tracking
async function initializeTracking() {
  try {
    // Load blocked sites
    const data = await chrome.storage.local.get(['blockedSites']);
    if (data.blockedSites) {
      blockedSites = data.blockedSites;
    }
    
    // Get active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      currentTabId = tabs[0].id;
      await startTracking();
    }
    
    // Listen for auth changes from web app
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local') {
        if (changes.token) {
          console.log('Auth token changed:', changes.token.newValue ? 'Logged in' : 'Logged out');
          if (changes.token.newValue) {
            console.log('✅ Extension now connected to backend');
          }
        }
        if (changes.user) {
          console.log('User data changed');
        }
      }
    });
    
    // Check if we have auth data and test connection
    const authData = await chrome.storage.local.get(['token', 'user']);
    if (authData.token) {
      console.log('✅ Found existing auth token, testing backend connection...');
      testBackendConnection(authData.token);
    }
    
  } catch (error) {
    console.error('Error initializing tracking:', error);
  }
}

// Test backend connection
async function testBackendConnection(token) {
  try {
    const response = await fetch('http://localhost:3000/api/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Backend connection successful - extension ready to sync');
    } else {
      console.log('❌ Backend connection failed:', response.status);
      if (response.status === 401) {
        await chrome.storage.local.remove(['token', 'user']);
        console.log('Auth token expired, removed from storage');
      }
    }
  } catch (error) {
    console.log('❌ Backend connection error:', error.message);
  }
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTimeData') {
    chrome.storage.local.get('timeData', (data) => {
      sendResponse({ timeData: data.timeData || {} });
    });
    return true;
  }
  
  if (request.action === 'getTodayData') {
    chrome.storage.local.get('todayData', (data) => {
      sendResponse({ todayData: data.todayData || {} });
    });
    return true;
  }
  
  if (request.action === 'clearTimeData') {
    chrome.storage.local.remove(['timeData', 'todayData'], () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'getCurrentTab') {
    sendResponse({ 
      currentTabId: currentTabId,
      isTracking: isTracking,
      startTime: startTime,
      trackingInterval: !!trackingInterval
    });
    return true;
  }
  
  if (request.action === 'getBlockedSites') {
    sendResponse({ blockedSites: blockedSites });
    return true;
  }
  
  if (request.action === 'addBlockedSite') {
    const { site } = request;
    if (site && !blockedSites.includes(site)) {
      blockedSites.push(site);
      chrome.storage.local.set({ blockedSites: blockedSites });
      console.log(`Added ${site} to blocked sites`);
    }
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === 'removeBlockedSite') {
    const { site } = request;
    const index = blockedSites.indexOf(site);
    if (index > -1) {
      blockedSites.splice(index, 1);
      chrome.storage.local.set({ blockedSites: blockedSites });
      console.log(`Removed ${site} from blocked sites`);
    }
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === 'checkAuthStatus') {
    chrome.storage.local.get(['token', 'user'], (data) => {
      sendResponse({ 
        isLoggedIn: !!data.token,
        user: data.user || null
      });
    });
    return true;
  }
  
  if (request.action === 'syncAuth') {
    const { token, user } = request;
    chrome.storage.local.set({ token, user }, () => {
      console.log('✅ Auth data synced from web app');
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'logout') {
    chrome.storage.local.remove(['token', 'user'], () => {
      blockedSites = [
        'facebook.com', 'youtube.com', 'twitter.com', 'x.com', 'instagram.com',
        'tiktok.com', 'reddit.com', 'netflix.com', 'hulu.com', 'disneyplus.com',
        'amazon.com/prime', 'twitch.tv', 'discord.com', 'snapchat.com', 'pinterest.com'
      ];
      chrome.storage.local.set({ blockedSites: blockedSites });
      console.log('User logged out, reset blocked sites');
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'debugTracking') {
    sendResponse({ 
      currentTabId: currentTabId,
      isTracking: isTracking,
      startTime: startTime,
      trackingInterval: !!trackingInterval,
      blockedSites: blockedSites
    });
    return true;
  }
  
  if (request.action === 'startManualTracking') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs.length > 0) {
        currentTabId = tabs[0].id;
        await startTracking();
        sendResponse({ success: true, message: 'Manual tracking started' });
      } else {
        sendResponse({ success: false, message: 'No active tab found' });
      }
    });
    return true;
  }
});

// Periodic cleanup
setInterval(async () => {
  try {
    if (isTracking && currentTabId) {
      const tab = await chrome.tabs.get(currentTabId);
      if (!tab || isChromeInternalPage(tab.url)) {
        console.log('Stopping tracking for invalid tab');
        await stopTracking();
      }
    }
  } catch (error) {
    console.error('Error in periodic cleanup:', error);
  }
}, 30000); 