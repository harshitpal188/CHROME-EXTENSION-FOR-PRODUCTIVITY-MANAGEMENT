import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { timeLogAPI } from '../services/api';

const DashboardPage = () => {
  const { user, logout, updatePreferences } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');
  const [newBlockedSite, setNewBlockedSite] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
    // Auto-sync auth with extension on dashboard load
    syncAuthWithExtensionOnLoad();
  }, [period]);

  // Auto-sync auth with extension when dashboard loads
  const syncAuthWithExtensionOnLoad = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (token && user) {
        console.log('🔄 Auto-syncing auth with extension...');
        
        // Try to sync with extension
        if (window.chrome && chrome.storage) {
          await chrome.storage.local.set({ token, user });
          console.log('✅ Auto-sync completed');
          
          // Also try runtime message
          if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
              action: 'syncAuth',
              token: token,
              user: user
            });
          }
        }
      }
    } catch (error) {
      console.log('Extension not available for auto-sync');
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching report for period:', period);
      
      const response = await timeLogAPI.getReport({ period });
      console.log('Report response:', response.data);
      
      setReportData(response.data.data);
    } catch (error) {
      console.error('Error fetching report:', error);
      setError('Failed to fetch report data: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchReport();
  };

  const handleSyncWithExtension = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (token && user) {
        // Try to sync with extension
        if (window.chrome && chrome.storage) {
          await chrome.storage.local.set({ token, user });
          console.log('✅ Manual auth sync completed');
          
          // Also try runtime message
          if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
              action: 'syncAuth',
              token: token,
              user: user
            });
          }
        }
        
        // Update auth status
        updateAuthStatus('Connected to extension');
        
        // Refresh the report data
        await fetchReport();
      } else {
        setError('No authentication data found. Please login again.');
        updateAuthStatus('Not authenticated');
      }
    } catch (error) {
      console.error('Error syncing with extension:', error);
      setError('Failed to sync with extension');
      updateAuthStatus('Sync failed');
    }
  };

  // Update auth status display
  const updateAuthStatus = (status) => {
    const authStatusEl = document.getElementById('authStatus');
    if (authStatusEl) {
      authStatusEl.textContent = status;
      if (status.includes('Connected')) {
        authStatusEl.className = 'ml-2 text-green-600 font-medium';
      } else if (status.includes('Not') || status.includes('failed')) {
        authStatusEl.className = 'ml-2 text-red-600 font-medium';
      } else {
        authStatusEl.className = 'ml-2 text-blue-600 font-medium';
      }
    }
  };

  const handleAddBlockedSite = async () => {
    if (!newBlockedSite.trim()) return;

    try {
      const updatedSites = [...(user.preferences.blockedSites || []), newBlockedSite.trim()];
      const result = await updatePreferences({
        blockedSites: updatedSites
      });

      if (result.success) {
        setNewBlockedSite('');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to add blocked site');
    }
  };

  const handleRemoveBlockedSite = async (site) => {
    try {
      const updatedSites = user.preferences.blockedSites.filter(s => s !== site);
      const result = await updatePreferences({
        blockedSites: updatedSites
      });

      if (!result.success) {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to remove blocked site');
    }
  };

  const formatTime = (milliseconds) => {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const formatPercentage = (value, total) => {
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Productivity Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.email}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </button>
              <button
                onClick={handleSyncWithExtension}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sync with Extension
              </button>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Auth Status */}
        <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          <div className="flex items-center justify-between">
            <div>
              <strong>Extension Connection Status:</strong>
              <span id="authStatus" className="ml-2">Checking...</span>
            </div>
            <button
              onClick={handleSyncWithExtension}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
            >
              Force Sync
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="mb-8">
          <div className="flex space-x-4">
            <button
              onClick={() => setPeriod('daily')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                period === 'daily'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Daily Report
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                period === 'weekly'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Weekly Report
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {reportData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Total Time</h3>
              <p className="text-3xl font-bold text-indigo-600">
                {formatTime(reportData.totals.totalTime)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Total Visits</h3>
              <p className="text-3xl font-bold text-green-600">
                {reportData.totals.totalVisits}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">Sites Visited</h3>
              <p className="text-3xl font-bold text-purple-600">
                {reportData.sites.length}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Time Chart */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {period === 'daily' ? 'Today\'s' : 'This Week\'s'} Time Breakdown
              </h3>
            </div>
            <div className="p-6">
              {reportData && reportData.sites.length > 0 ? (
                <div className="space-y-4">
                  {reportData.sites.slice(0, 10).map((site, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-900">{site.hostname}</span>
                          <span className="text-gray-600">{formatTime(site.totalTime)}</span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{
                              width: formatPercentage(site.totalTime, reportData.totals.totalTime)
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>
          </div>

          {/* Blocked Sites */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Blocked Sites</h3>
            </div>
            <div className="p-6">
              {/* Add new blocked site */}
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={newBlockedSite}
                  onChange={(e) => setNewBlockedSite(e.target.value)}
                  placeholder="Enter site domain (e.g., facebook.com)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddBlockedSite()}
                />
                <button
                  onClick={handleAddBlockedSite}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Add
                </button>
              </div>

              {/* Blocked sites list */}
              <div className="space-y-2">
                {user?.preferences?.blockedSites?.map((site, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md"
                  >
                    <span className="text-red-800 font-medium">{site}</span>
                    <button
                      onClick={() => handleRemoveBlockedSite(site)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {(!user?.preferences?.blockedSites || user.preferences.blockedSites.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No blocked sites configured</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 