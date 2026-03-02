import { useEffect, useCallback } from 'react';
import { BarcodeScanner as CapacitorBarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';
import { showToast } from './Toast';

export default function BarcodeScanner({ onBarcodeDetected, onClose }) {
  const { t } = useTranslation();

  const stopScanner = useCallback(async () => {
    try {
      await CapacitorBarcodeScanner.stopScan();
      await CapacitorBarcodeScanner.removeAllListeners();
    } catch (err) {
      console.error('Stop scanner error:', err);
    }
  }, []);

  useEffect(() => {
    const checkAndStartScanner = async () => {
      onClose();

      const native = Capacitor.isNativePlatform();

      if (!native) {
        showToast(t('scanner.manualOnly'), 'info');
        return;
      }

      try {
        const { supported } = await CapacitorBarcodeScanner.isSupported();

        if (!supported) {
          showToast(t('scanner.notSupported'), 'warning');
          return;
        }

        if (typeof CapacitorBarcodeScanner.isGoogleBarcodeScannerModuleAvailable === 'function') {
          const { available } = await CapacitorBarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
          if (!available && typeof CapacitorBarcodeScanner.installGoogleBarcodeScannerModule === 'function') {
            await CapacitorBarcodeScanner.installGoogleBarcodeScannerModule();
          }
        }

        const result = await CapacitorBarcodeScanner.scan();
        const barcodeValue = result?.barcodes?.[0]?.displayValue || result?.barcodes?.[0]?.rawValue;

        if (barcodeValue) {
          onBarcodeDetected(barcodeValue);
        }
      } catch (err) {
        console.error('Scanner check error:', err);

        if (err?.message?.toLowerCase?.().includes('cancel')) {
          return;
        }

        showToast(t('scanner.initFailed', { error: err?.message || '' }), 'error');
      }
    };

    checkAndStartScanner();

    return () => {
      stopScanner();
    };
  }, [onBarcodeDetected, onClose, stopScanner, t]);

  return null;
}
