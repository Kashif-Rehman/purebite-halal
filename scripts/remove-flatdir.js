const fs = require('fs');
const path = require('path');

const targetPath = path.join(
  __dirname,
  '..',
  'android',
  'capacitor-cordova-android-plugins',
  'build.gradle'
);

if (!fs.existsSync(targetPath)) {
  console.log('remove-flatdir: build.gradle not found, skipping.');
  process.exit(0);
}

const original = fs.readFileSync(targetPath, 'utf8');
let updated = original;

// Remove any flatDir block in repositories (supports multiple formatting styles)
updated = updated.replace(/\n\s*flatDir\s*\{[\s\S]*?\}\s*/gm, '\n');

// Remove local libs fileTree dependency in capacitor-cordova-android-plugins only
updated = updated.replace(/^\s*implementation\s+fileTree\([^\n]*src\/main\/libs[^\n]*\)\s*\r?\n/gm, '');

if (updated !== original) {
  fs.writeFileSync(targetPath, updated, 'utf8');
  console.log('remove-flatdir: removed flatDir repo and local libs dependency.');
} else {
  console.log('remove-flatdir: no changes needed.');
}
