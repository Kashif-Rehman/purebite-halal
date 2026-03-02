const fs = require('fs');
const path = require('path');

const gradleFilePath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@capacitor',
  'haptics',
  'android',
  'build.gradle'
);

const legacyValue = "getDefaultProguardFile('proguard-android.txt')";
const optimizeValue = "getDefaultProguardFile('proguard-android-optimize.txt')";

function run() {
  if (!fs.existsSync(gradleFilePath)) {
    console.log('fix-haptics-proguard: skipped (file not found).');
    return;
  }

  const content = fs.readFileSync(gradleFilePath, 'utf8');

  if (content.includes(optimizeValue)) {
    console.log('fix-haptics-proguard: already patched.');
    return;
  }

  if (!content.includes(legacyValue)) {
    console.log('fix-haptics-proguard: pattern not found, no changes made.');
    return;
  }

  const updated = content.replace(legacyValue, optimizeValue);
  fs.writeFileSync(gradleFilePath, updated, 'utf8');
  console.log('fix-haptics-proguard: patched capacitor-haptics build.gradle successfully.');
}

run();
