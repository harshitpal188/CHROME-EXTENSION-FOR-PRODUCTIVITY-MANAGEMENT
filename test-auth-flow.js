// Simple test to verify auth flow
const axios = require('axios');

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow...\n');

  try {
    // 1. Register a test user
    console.log('1. Registering test user...');
    const registerResponse = await axios.post('http://localhost:3000/api/auth/register', {
      email: 'test@example.com',
      password: 'password123',
      preferences: {
        blockedSites: ['facebook.com'],
        dailyGoal: 480,
        notifications: true,
        theme: 'auto'
      }
    });
    
    const token = registerResponse.data.data.token;
    console.log('✅ User registered, token received');

    // 2. Test profile endpoint
    console.log('\n2. Testing profile endpoint...');
    const profileResponse = await axios.get('http://localhost:3000/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Profile endpoint working');

    // 3. Test time log creation
    console.log('\n3. Testing time log creation...');
    const timeLogResponse = await axios.post('http://localhost:3000/api/timelog', {
      site: 'Test Site',
      hostname: 'test.com',
      timeSpent: 60000, // 1 minute
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
    const reportResponse = await axios.get('http://localhost:3000/api/report?period=daily', {
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

    console.log('\n🎉 Authentication flow test passed!');
    console.log('\n📋 Next steps:');
    console.log('1. Open http://localhost:5173');
    console.log('2. Login with test@example.com / password123');
    console.log('3. Click "Sync with Extension" button');
    console.log('4. Check extension popup for connection status');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAuthFlow(); 