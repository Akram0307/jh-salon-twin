const path = require('path');
const zlib = require('zlib');

// Calculate gzip size
function calculateGzipSize(filePath) {
  const fs = require('fs');
  const content = fs.readFileSync(filePath);
  return zlib.gzipSync(content).length;
}

module.exports = [
  {
    path: '.next/static/chunks/**/*.js',
    name: 'Initial JS Bundle',
    limit: '200 kB',
    gzip: true,
  },
  {
    path: '.next/static/css/**/*.css',
    name: 'CSS Bundle',
    limit: '50 kB',
    gzip: true,
  },
  {
    path: '.next/static/chunks/pages/**/*.js',
    name: 'Page Bundles',
    limit: '100 kB',
    gzip: true,
  },
];
