// Manual auth injection script
// Run this in the browser console on the dashboard page

function injectAuthToExtension() {
  console.log('🔧 Injecting auth data to extension...');
  
  // Get auth data from localStorage
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    console.log('❌ No auth token found. Please login first.');
    return;
  }
  
  console.log('✅ Found auth token:', token.substring(0, 20) + '...');
  console.log('✅ Found user:', user.email);
  
  // Try to inject via chrome.storage
  if (window.chrome && chrome.storage) {
    chrome.storage.local.set({ token, user }, () => {
      console.log('✅ Auth data injected to extension storage');
      
      // Also try runtime message
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          action: 'syncAuth',
          token: token,
          user: user
        }, (response) => {
          if (response && response.success) {
            console.log('✅ Auth data synced via runtime message');
          } else {
            console.log('❌ Runtime message failed');
          }
        });
      }
    });
  } else {
    console.log('❌ Chrome extension API not available');
  }
}

// Test backend connection
async function testBackendConnection() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('❌ No token available for backend test');
    return;
  }
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Backend connection successful');
      const data = await response.json();
      console.log('👤 User profile:', data.data.user.email);
    } else {
      console.log('❌ Backend connection failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Backend connection error:', error.message);
  }
}

// Run both functions
console.log('🚀 Starting manual auth injection...');
injectAuthToExtension();
setTimeout(testBackendConnection, 1000);

console.log('\n📋 Instructions:');
console.log('1. Run this script in the browser console on the dashboard page');
console.log('2. Check the extension popup for connection status');
console.log('3. Browse some websites to test time tracking');
console.log('4. Refresh the dashboard to see real data'); 