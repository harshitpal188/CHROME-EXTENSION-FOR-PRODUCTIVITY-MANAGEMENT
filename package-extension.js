const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Create a file to stream archive data to
const output = fs.createWriteStream(path.join(__dirname, 'productivity-tracker-extension.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
  console.log('✅ Extension packaged successfully!');
  console.log(`📦 Archive size: ${archive.pointer()} bytes`);
  console.log('\n📋 To load the extension in Chrome:');
  console.log('1. Open Chrome and go to chrome://extensions/');
  console.log('2. Enable "Developer mode" (toggle in top right)');
  console.log('3. Click "Load unpacked"');
  console.log('4. Select the "extension" folder from this project');
  console.log('\n🎯 The extension is now ready to use!');
});

// Good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn('Warning:', err);
  } else {
    throw err;
  }
});

// Good practice to catch this error explicitly
archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add the extension folder to the archive
archive.directory('extension/', 'extension');

// Finalize the archive (ie we are done appending files but streams have to finish yet)
archive.finalize(); 