// Test script to verify data flow
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testDataFlow() {
  console.log('🧪 Testing Productivity Tracker Data Flow...\n');

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

    // 3. Test time log creation
    console.log('\n3. Testing time log creation...');
    const timeLogResponse = await axios.post(`${API_BASE_URL}/timelog`, {
      site: 'Test Site',
      hostname: 'test.com',
      timeSpent: 300000, // 5 minutes
      title: 'Test Page',
      url: 'https://test.com',
      date: new Date().toISOString()
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Time log created successfully');

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
      sitesCount: reportResponse.data.data.sites.length
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

    console.log('\n🎉 All tests passed! Data flow is working correctly.');
    console.log('\n📋 Next steps:');
    console.log('1. Start the extension and browse some websites');
    console.log('2. Check the extension popup for time tracking data');
    console.log('3. Refresh the web dashboard to see the data');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the server is running on port 3000');
    console.log('2. Check that all API endpoints are working');
    console.log('3. Verify the extension is properly loaded');
  }
}

testDataFlow(); 