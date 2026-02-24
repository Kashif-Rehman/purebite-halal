# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Capacitor core
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.annotation.* <methods>;
}

# ML Kit barcode scanning (Capacitor ML Kit plugin)
-keep class com.google.mlkit.** { *; }
-keep class com.google.android.gms.internal.** { *; }
-keep class com.google.android.gms.vision.** { *; }
-dontwarn com.google.mlkit.**
-dontwarn com.google.android.gms.**

# Capacitor ML Kit Barcode Scanning plugin
-keep class com.capacitormlkit.barcodescanning.** { *; }

# Keep JavaScript interface for Capacitor WebView bridge
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# AndroidX Camera (if used by barcode scanner)
-keep class androidx.camera.** { *; }
-dontwarn androidx.camera.**
