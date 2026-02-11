# PureBite Halal - Build Scripts

## Build for Production

### Step 1: Build Web Assets
```powershell
npm run build
```

### Step 2: Sync to Android
```powershell
npx cap sync android
```

### Step 3: Generate Release Bundle (Play Store)
```powershell
cd android
.\gradlew bundleRelease
```

**Output Location**: `android/app/build/outputs/bundle/release/app-release.aab`

### Step 4: Generate Release APK (Testing)
```powershell
cd android
.\gradlew assembleRelease
```

**Output Location**: `android/app/build/outputs/apk/release/app-release.apk`

---

## Quick Build Command (All Steps)
```powershell
npm run build; npx cap sync android; cd android; .\gradlew bundleRelease
```

---

## Test Release Build on Device

### Install APK
```powershell
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Check if device is connected
```powershell
adb devices
```

---

## Verify Bundle
```powershell
bundletool build-apks --bundle=android/app/build/outputs/bundle/release/app-release.aab --output=app.apks
bundletool get-size total --apks=app.apks
```

---

## Clean Build (if issues occur)
```powershell
cd android
.\gradlew clean
.\gradlew bundleRelease
```

---

## Before Each Release

1. Update version in `android/app/build.gradle`:
   - Increment `versionCode` (1 → 2 → 3...)
   - Update `versionName` ("1.0.0" → "1.0.1" → "1.1.0")

2. Update version in `src/components/About.jsx`:
   - Update `appVersion` constant

3. Build & test
4. Generate signed bundle
5. Upload to Play Console

---

## File Sizes (approximate)
- App Bundle (.aab): ~5-8 MB
- Installed size: ~12-15 MB
- APK size: ~8-10 MB
