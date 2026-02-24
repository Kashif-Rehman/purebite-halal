package com.halalfoodchecker.app;

import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // Enable edge-to-edge for Android 5.0+ with backward compatibility
    // For Android 15+, this ensures proper inset handling
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      try {
        // Use reflection to safely call enableEdgeToEdge if available
        Class<?> edgeToEdgeClass = Class.forName("androidx.activity.EdgeToEdge");
        edgeToEdgeClass.getMethod("enable", androidx.activity.ComponentActivity.class)
            .invoke(null, this);
      } catch (Exception e) {
        // Fall back if EdgeToEdge is not available
      }
    }
  }
}
