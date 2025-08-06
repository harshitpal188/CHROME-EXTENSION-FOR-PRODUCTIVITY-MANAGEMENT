// Content script for Productivity Tracker
// This script runs on web pages to provide additional tracking functionality

console.log('Productivity Tracker content script loaded');

// Track page visibility changes
let isPageVisible = true;
let lastActiveTime = Date.now();

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    isPageVisible = false;
    console.log('Page became hidden');
  } else {
    isPageVisible = true;
    lastActiveTime = Date.now();
    console.log('Page became visible');
  }
});

// Track user activity (mouse movements, clicks, keyboard input)
let userActivityTimeout;

function resetUserActivity() {
  clearTimeout(userActivityTimeout);
  userActivityTimeout = setTimeout(() => {
    console.log('User inactive for 5 minutes');
  }, 5 * 60 * 1000); // 5 minutes
}

// Listen for user activity
document.addEventListener('mousemove', resetUserActivity);
document.addEventListener('click', resetUserActivity);
document.addEventListener('keydown', resetUserActivity);
document.addEventListener('scroll', resetUserActivity);

// Initialize activity tracking
resetUserActivity();

// Send message to background script when page loads
window.addEventListener('load', () => {
  chrome.runtime.sendMessage({
    action: 'pageLoaded',
    url: window.location.href,
    title: document.title
  });
});

// Optional: Track focus/blur events
window.addEventListener('focus', () => {
  console.log('Window focused');
});

window.addEventListener('blur', () => {
  console.log('Window blurred');
}); 