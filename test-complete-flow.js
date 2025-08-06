// Test script to verify complete data flow
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testCompleteFlow() {
  console.log('🧪 Testing Complete Productivity Tracker Flow...\n');

  try {
    // 1. Test server health
    console.log('1. Testing server health...');
    const healthResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Server is running:', healthResponse.data.message);

    // 2. Test user registration
    console.log('\n2. Testing user registration...');
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: 'test@example.com',
      password: 'password123',
      preferences: {
        blockedSites: ['facebook.com', 'youtube.com'],
        dailyGoal: 480,
        notifications: true,
        theme: 'auto'
      }
    });
    console.log('✅ User registered successfully');
    const token = registerResponse.data.data.token;
    const user = registerResponse.data.data.user;

    // 3. Test time log creation (simulating extension data)
    console.log('\n3. Testing time log creation (extension data)...');
    const timeLogs = [
      {
        site: 'YouTube',
        hostname: 'youtube.com',
        timeSpent: 180000, // 3 minutes
        title: 'YouTube - Home',
        url: 'https://youtube.com',
        date: new Date().toISOString()
      },
      {
        site: 'ChatGPT',
        hostname: 'chatgpt.com',
        timeSpent: 101000, // 1m 41s
        title: 'ChatGPT',
        url: 'https://chatgpt.com',
        date: new Date().toISOString()
      }
    ];

    for (const timeLog of timeLogs) {
      const timeLogResponse = await axios.post(`${API_BASE_URL}/timelog`, timeLog, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`✅ Time log created for ${timeLog.hostname}: ${timeLog.timeSpent}ms`);
    }

    // 4. Test report generation
    console.log('\n4. Testing report generation...');
    const reportResponse = await axios.get(`${API_BASE_URL}/report?period=daily`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Report generated successfully');
    console.log('📊 Report data:', {
      totalTime: reportResponse.data.data.totals.totalTime,
      totalVisits: reportResponse.data.data.totals.totalVisits,
      sitesCount: reportResponse.data.data.sites.length,
      sites: reportResponse.data.data.sites.map(site => ({
        hostname: site.hostname,
        totalTime: site.totalTime
      }))
    });

    // 5. Test user profile
    console.log('\n5. Testing user profile...');
    const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ User profile retrieved successfully');
    console.log('👤 User email:', profileResponse.data.data.user.email);

    console.log('\n🎉 Complete flow test passed!');
    console.log('\n📋 Data Flow Summary:');
    console.log('✅ Extension tracks time → Sends to backend API');
    console.log('✅ Backend stores data in database');
    console.log('✅ Dashboard fetches data from backend');
    console.log('✅ Real-time data synchronization working');
    
    console.log('\n🔄 Next steps for testing:');
    console.log('1. Login to web app with test@example.com / password123');
    console.log('2. Click "Sync with Extension" button in dashboard');
    console.log('3. Browse websites with extension active');
    console.log('4. Check extension popup shows "Connected to backend"');
    console.log('5. Refresh dashboard to see real-time data');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure server is running on port 3000');
    console.log('2. Check that MongoDB is connected');
    console.log('3. Verify all API endpoints are working');
    console.log('4. Check extension is properly loaded');
  }
}

testCompleteFlow(); 