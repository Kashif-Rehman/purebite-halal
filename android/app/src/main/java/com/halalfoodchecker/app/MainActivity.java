package com.halalfoodchecker.app;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    // Enable edge-to-edge BEFORE super.onCreate() for proper Android 15+ support
    EdgeToEdge.enable(this);
    
    super.onCreate(savedInstanceState);
    
    // Handle window insets for proper edge-to-edge display
    ViewCompat.setOnApplyWindowInsetsListener(getBridge().getWebView(), (v, insets) -> {
      // Let the WebView handle insets naturally via CSS env() variables
      return WindowInsetsCompat.CONSUMED;
    });
  }
}
