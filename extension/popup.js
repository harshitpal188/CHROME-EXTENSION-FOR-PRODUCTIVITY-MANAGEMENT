// Popup script for Productivity Tracker
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const todayTotalTimeEl = document.getElementById('todayTotalTime');
    const todaySitesCountEl = document.getElementById('todaySitesCount');
    const todayMostVisitedEl = document.getElementById('todayMostVisited');
    const todayTimeListEl = document.getElementById('todayTimeList');
    const allTimeListEl = document.getElementById('allTimeList');
    const refreshBtn = document.getElementById('refreshBtn');
    const clearBtn = document.getElementById('clearBtn');
    const newSiteInput = document.getElementById('newSiteInput');
    const addSiteBtn = document.getElementById('addSiteBtn');
    const blockedSitesList = document.getElementById('blockedSitesList');
    const logoutBtn = document.getElementById('logoutBtn');

    // Loading state management
    let isLoading = false;

    // Show loading spinner
    function showLoading() {
        isLoading = true;
        todayTimeListEl.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading data...</p>
            </div>
        `;
        allTimeListEl.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading data...</p>
            </div>
        `;
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Loading...';
    }

    // Hide loading spinner
    function hideLoading() {
        isLoading = false;
        refreshBtn.disabled = false;
        refreshBtn.textContent = 'Refresh';
    }

    // Load and display time data from chrome.storage.local
    function loadTimeData() {
        if (isLoading) return;
        
        showLoading();
        
        // Get data from background script
        chrome.runtime.sendMessage({ action: 'getTimeData' }, (response) => {
            if (response && response.timeData) {
                displayAllTimeData(response.timeData);
            } else {
                displayAllTimeEmptyState();
            }
        });
        
        // Get today's data from background script
        chrome.runtime.sendMessage({ action: 'getTodayData' }, (response) => {
            if (response && response.todayData && Object.keys(response.todayData).length > 0) {
                displayTodayData(response.todayData);
            } else {
                displayTodayEmptyState();
            }
            hideLoading();
        });
    }

    // Display today's time data
    function displayTodayData(todayData) {
        const sites = Object.keys(todayData);
        
        if (sites.length === 0) {
            displayTodayEmptyState();
            return;
        }

        // Calculate today's statistics
        const totalSites = sites.length;
        const totalTimeMs = Object.values(todayData).reduce((sum, time) => sum + time, 0);
        const totalTimeFormatted = formatTime(totalTimeMs);
        
        // Find most visited site today
        const mostVisitedSite = sites.reduce((max, site) => 
            todayData[site] > todayData[max] ? site : max
        );

        // Update today's statistics
        todaySitesCountEl.textContent = totalSites;
        todayTotalTimeEl.textContent = totalTimeFormatted;
        todayMostVisitedEl.textContent = mostVisitedSite;

        // Display today's time list
        displayTodayTimeList(todayData);
    }

    // Display all-time data
    function displayAllTimeData(allTimeData) {
        const sites = Object.keys(allTimeData);
        
        if (sites.length === 0) {
            displayAllTimeEmptyState();
            return;
        }

        // Display all-time time list
        displayAllTimeList(allTimeData);
    }

    // Display today's list of sites and their time
    function displayTodayTimeList(todayData) {
        const sites = Object.keys(todayData);
        
        // Sort sites by time spent (descending)
        sites.sort((a, b) => todayData[b] - todayData[a]);

        // Clear existing content
        todayTimeListEl.innerHTML = '';

        // Create time items
        sites.forEach(site => {
            const timeItem = document.createElement('div');
            timeItem.className = 'time-item';
            
            const siteName = document.createElement('span');
            siteName.className = 'site-name';
            siteName.textContent = site;
            
            const siteTime = document.createElement('span');
            siteTime.className = 'site-time';
            siteTime.textContent = formatTime(todayData[site]);
            
            timeItem.appendChild(siteName);
            timeItem.appendChild(siteTime);
            todayTimeListEl.appendChild(timeItem);
        });
    }

    // Display all-time list of sites and their time
    function displayAllTimeList(allTimeData) {
        const sites = Object.keys(allTimeData);
        
        // Sort sites by time spent (descending)
        sites.sort((a, b) => allTimeData[b] - allTimeData[a]);

        // Clear existing content
        allTimeListEl.innerHTML = '';

        // Create time items
        sites.forEach(site => {
            const timeItem = document.createElement('div');
            timeItem.className = 'time-item';
            
            const siteName = document.createElement('span');
            siteName.className = 'site-name';
            siteName.textContent = site;
            
            const siteTime = document.createElement('span');
            siteTime.className = 'site-time';
            siteTime.textContent = formatTime(allTimeData[site]);
            
            timeItem.appendChild(siteName);
            timeItem.appendChild(siteTime);
            allTimeListEl.appendChild(timeItem);
        });
    }

    // Display empty state for today's data
    function displayTodayEmptyState() {
        todaySitesCountEl.textContent = '0';
        todayTotalTimeEl.textContent = '0m 0s';
        todayMostVisitedEl.textContent = '-';
        
        todayTimeListEl.innerHTML = `
            <div class="empty-state">
                <p>No data for today yet. Start browsing to see your time tracking!</p>
            </div>
        `;
    }

    // Display empty state for all-time data
    function displayAllTimeEmptyState() {
        allTimeListEl.innerHTML = `
            <div class="empty-state">
                <p>No all-time data yet. Start browsing to see your time tracking!</p>
            </div>
        `;
    }

    // Format milliseconds to human readable time
    function formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            const remainingMinutes = minutes % 60;
            return `${hours}h ${remainingMinutes}m`;
        } else if (minutes > 0) {
            const remainingSeconds = seconds % 60;
            return `${minutes}m ${remainingSeconds}s`;
        } else {
            return `${seconds}s`;
        }
    }

    // Handle refresh button click
    refreshBtn.addEventListener('click', () => {
        loadTimeData();
    });

    // Handle clear data button click
    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all time tracking data? This cannot be undone.')) {
            clearBtn.textContent = 'Clearing...';
            clearBtn.disabled = true;
            
            chrome.runtime.sendMessage({ action: 'clearTimeData' }, (response) => {
                if (response && response.success) {
                    displayTodayEmptyState();
                    displayAllTimeEmptyState();
                }
                
                setTimeout(() => {
                    clearBtn.textContent = 'Clear Data';
                    clearBtn.disabled = false;
                }, 1000);
            });
        }
    });

    // Check authentication status and sync with backend
    function checkAuthStatus() {
        const authIndicator = document.getElementById('authIndicator');
        const authText = document.getElementById('authText');
        
        chrome.runtime.sendMessage({ action: 'checkAuthStatus' }, (response) => {
            if (response && response.isLoggedIn) {
                console.log('✅ User is logged in, syncing with backend...');
                authIndicator.classList.add('connected');
                authText.textContent = `Connected as ${response.user?.email || 'user'}`;
                
                // Test backend connection
                testBackendConnection();
            } else {
                console.log('❌ User not logged in, using local data only');
                authIndicator.classList.remove('connected');
                authText.textContent = 'Not connected - data saved locally only';
                
                // Show manual sync instructions
                showManualSyncInstructions();
            }
        });
    }

    // Show manual sync instructions
    function showManualSyncInstructions() {
        const authText = document.getElementById('authText');
        authText.innerHTML = `
            Not connected - data saved locally only<br>
            <small style="color: #666;">
                To connect: Login to web app and click "Sync with Extension" button
            </small>
        `;
    }

    // Test backend connection
    function testBackendConnection() {
        chrome.storage.local.get(['token'], (data) => {
            if (data.token) {
                fetch('http://localhost:3000/api/auth/profile', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${data.token}`,
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    if (response.ok) {
                        console.log('✅ Backend connection successful');
                        const authText = document.getElementById('authText');
                        authText.innerHTML = `
                            Connected to backend - data syncing<br>
                            <small style="color: #4CAF50;">✓ Real-time updates active</small>
                        `;
                    } else {
                        console.log('❌ Backend connection failed:', response.status);
                        const authText = document.getElementById('authText');
                        authText.innerHTML = `
                            Backend connection failed<br>
                            <small style="color: #f44336;">Server may be down</small>
                        `;
                    }
                })
                .catch(error => {
                    console.log('❌ Backend connection error:', error);
                    const authText = document.getElementById('authText');
                    authText.innerHTML = `
                        Backend connection error<br>
                        <small style="color: #f44336;">Check if server is running</small>
                    `;
                });
            } else {
                console.log('❌ No auth token found');
            }
        });
    }

    // Load data when popup opens
    loadTimeData();
    loadBlockedSites();
    checkAuthStatus();

    // Auto-refresh every 30 seconds
    setInterval(loadTimeData, 30000);
    
    // Blocked sites functionality
    function loadBlockedSites() {
        chrome.runtime.sendMessage({ action: 'getBlockedSites' }, (response) => {
            if (response && response.blockedSites) {
                displayBlockedSites(response.blockedSites);
            }
        });
    }
    
    function displayBlockedSites(blockedSites) {
        blockedSitesList.innerHTML = '';
        
        if (blockedSites.length === 0) {
            blockedSitesList.innerHTML = '<p style="font-size: 12px; opacity: 0.7; text-align: center;">No sites blocked yet</p>';
            return;
        }
        
        blockedSites.forEach(site => {
            const siteItem = document.createElement('div');
            siteItem.className = 'blocked-site-item';
            
            const siteName = document.createElement('span');
            siteName.className = 'blocked-site-name';
            siteName.textContent = site;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-site-btn';
            removeBtn.textContent = 'Remove';
            removeBtn.addEventListener('click', () => removeBlockedSite(site));
            
            siteItem.appendChild(siteName);
            siteItem.appendChild(removeBtn);
            blockedSitesList.appendChild(siteItem);
        });
    }
    
    function addBlockedSite(site) {
        if (!site || site.trim() === '') return;
        
        chrome.runtime.sendMessage({ 
            action: 'addBlockedSite', 
            site: site.trim() 
        }, (response) => {
            if (response && response.success) {
                newSiteInput.value = '';
                loadBlockedSites();
            }
        });
    }
    
    function removeBlockedSite(site) {
        chrome.runtime.sendMessage({ 
            action: 'removeBlockedSite', 
            site: site 
        }, (response) => {
            if (response && response.success) {
                loadBlockedSites();
            }
        });
    }
    
    // Handle add site button click
    addSiteBtn.addEventListener('click', () => {
        addBlockedSite(newSiteInput.value);
    });
    
    // Handle enter key in input
    newSiteInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addBlockedSite(newSiteInput.value);
        }
    });

    // Handle logout button click
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'logout' }, (response) => {
                if (response && response.success) {
                    // Update UI to show logged out state
                    const authIndicator = document.getElementById('authIndicator');
                    const authText = document.getElementById('authText');
                    authIndicator.classList.remove('connected');
                    authText.textContent = 'Not connected - data saved locally only';
                    
                    // Clear any user-specific data
                    loadBlockedSites();
                }
            });
        });
    }

    // Handle debug button click
    const debugBtn = document.getElementById('debugBtn');
    if (debugBtn) {
        debugBtn.addEventListener('click', () => {
            console.log('🔧 Debug: Checking connection status...');
            
            // Check auth status
            chrome.runtime.sendMessage({ action: 'checkAuthStatus' }, (authResponse) => {
                console.log('🔧 Auth status:', authResponse);
                
                // Check storage
                chrome.storage.local.get(['token', 'user', 'timeData', 'todayData'], (storageData) => {
                    console.log('🔧 Storage data:', {
                        hasToken: !!storageData.token,
                        hasUser: !!storageData.user,
                        timeDataKeys: Object.keys(storageData.timeData || {}),
                        todayDataKeys: Object.keys(storageData.todayData || {})
                    });
                    
                    // Test backend connection
                    if (storageData.token) {
                        fetch('http://localhost:3000/api/auth/profile', {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${storageData.token}`,
                                'Content-Type': 'application/json'
                            }
                        })
                        .then(response => {
                            console.log('🔧 Backend response status:', response.status);
                            if (response.ok) {
                                console.log('🔧 Backend connection: OK');
                            } else {
                                console.log('🔧 Backend connection: FAILED');
                            }
                        })
                        .catch(error => {
                            console.log('🔧 Backend connection error:', error.message);
                        });
                    } else {
                        console.log('🔧 No auth token found');
                    }
                });
            });
        });
    }
}); 