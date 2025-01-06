const fs = require('fs');
const path = require('path');

// Get environment variables
const env = {
    OPENWEBUI_URL: process.env.OPENWEBUI_URL || 'http://localhost:3000',
    PWA_PORT: process.env.PWA_PORT || 3001,
    NODE_ENV: process.env.NODE_ENV || 'production'
};

// Create env.js content
const content = `window.__ENV__ = ${JSON.stringify(env, null, 2)};`;

// Write to file
const filePath = path.join(__dirname, '../public/js/env.js');
fs.writeFileSync(filePath, content);

console.log('env.js generated successfully'); 