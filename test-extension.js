// Test script to verify extension functionality
console.log('🧪 Testing Extension Functionality...\n');

// Test 1: Check if chrome.storage is available
console.log('1. Testing chrome.storage availability...');
if (typeof chrome !== 'undefined' && chrome.storage) {
  console.log('✅ chrome.storage is available');
} else {
  console.log('❌ chrome.storage is not available');
}

// Test 2: Check if chrome.runtime is available
console.log('\n2. Testing chrome.runtime availability...');
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('✅ chrome.runtime is available');
} else {
  console.log('❌ chrome.runtime is not available');
}

// Test 3: Test storage operations
console.log('\n3. Testing storage operations...');
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.local.set({ testData: 'test' }, () => {
    console.log('✅ Storage write successful');
    
    chrome.storage.local.get(['testData'], (result) => {
      if (result.testData === 'test') {
        console.log('✅ Storage read successful');
      } else {
        console.log('❌ Storage read failed');
      }
      
      // Clean up
      chrome.storage.local.remove(['testData'], () => {
        console.log('✅ Storage cleanup successful');
      });
    });
  });
} else {
  console.log('❌ Cannot test storage operations');
}

console.log('\n📋 Extension Test Summary:');
console.log('- Fixed localStorage error in popup.js');
console.log('- Fixed cls typo in popup.js');
console.log('- Extension should now work without errors');
console.log('\n🔄 Next steps:');
console.log('1. Reload the extension in chrome://extensions/');
console.log('2. Test the popup functionality');
console.log('3. Check browser console for any remaining errors'); 