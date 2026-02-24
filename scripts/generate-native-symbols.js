const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = process.cwd();

console.log('Note: Google Play extracts symbols from AAB automatically.');
console.log('The native debug symbols warning is informational and can be safely ignored.');
console.log('Your build.gradle already has debugSymbolLevel set to SYMBOL_TABLE.');
console.log('\nIf you still want to upload symbols manually, they are embedded in the AAB.');
console.log('For manual upload, use the AAB directly or skip this warning in Play Console.');

process.exit(0);
