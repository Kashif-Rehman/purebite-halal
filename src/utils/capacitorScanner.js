import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

export const isScanningSupported = async () => {
  if (!isNativePlatform()) return false;
  try {
    const { supported } = await BarcodeScanner.isSupported();
    return supported;
  } catch (error) {
    console.error('Check support error:', error);
    return false;
  }
};

export const requestPermissions = async () => {
  try {
    const { camera } = await BarcodeScanner.requestPermissions();
    return camera === 'granted' || camera === 'limited';
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
};

export const checkPermissions = async () => {
  try {
    const { camera } = await BarcodeScanner.checkPermissions();
    return camera === 'granted' || camera === 'limited';
  } catch (error) {
    console.error('Check permission error:', error);
    return false;
  }
};

export const startScan = async (onBarcodeDetected, onError) => {
  try {
    // Check permission first
    const hasPermission = await checkPermissions();
    if (!hasPermission) {
      const granted = await requestPermissions();
      if (!granted) {
        onError('Camera permission denied');
        return;
      }
    }

    // Make background transparent for camera view
    document.querySelector('body')?.classList.add('barcode-scanner-active');

    // Add listener for barcode detection
    const listener = await BarcodeScanner.addListener('barcodeScanned', async (result) => {
      await stopScan();
      onBarcodeDetected(result.barcode.displayValue);
    });

    // Start scanning
    await BarcodeScanner.startScan();
    
    return listener;
  } catch (error) {
    console.error('Start scan error:', error);
    onError(error.message || 'Failed to start scanner');
    await stopScan();
  }
};

export const stopScan = async () => {
  try {
    // Restore background
    document.querySelector('body')?.classList.remove('barcode-scanner-active');
    
    // Remove all listeners
    await BarcodeScanner.removeAllListeners();
    
    // Stop scanning
    await BarcodeScanner.stopScan();
  } catch (error) {
    console.error('Stop scan error:', error);
  }
};