import React, { useState, useEffect, useCallback } from 'react';
import { Camera, X, AlertTriangle } from 'lucide-react';
import { BarcodeScanner as CapacitorBarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';

export default function BarcodeScanner({ onBarcodeDetected, onClose }) {
  const { t } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [isNative, setIsNative] = useState(false);
  const [canScan, setCanScan] = useState(false);

  const stopScanner = useCallback(async () => {
    try {
      await CapacitorBarcodeScanner.stopScan();
      await CapacitorBarcodeScanner.removeAllListeners();
      document.querySelector('body')?.classList.remove('barcode-scanner-active');
    } catch (err) {
      console.error('Stop scanner error:', err);
    }
  }, []);

  const startNativeScan = useCallback(async () => {
    try {
      setIsScanning(true);
      setError('');

      console.log('Checking permissions...');

      // Check permission
      const { camera } = await CapacitorBarcodeScanner.checkPermissions();
      console.log('Camera permission status:', camera);

      if (camera !== 'granted' && camera !== 'limited') {
        console.log('Requesting camera permission...');
        const { camera: newPermission } = await CapacitorBarcodeScanner.requestPermissions();
        console.log('New permission status:', newPermission);

        if (newPermission !== 'granted' && newPermission !== 'limited') {
          setError(t('scanner.permissionDenied'));
          setIsScanning(false);
          return;
        }
      }

      console.log('Adding barcode listener...');

      // Add listener for barcode detection
      await CapacitorBarcodeScanner.addListener('barcodeScanned', async (result) => {
        console.log('Barcode detected:', result);

        if (result.barcode && result.barcode.displayValue) {
          await stopScanner();
          setIsScanning(false);
          onBarcodeDetected(result.barcode.displayValue);
          onClose();
        }
      });

      // Make background transparent
      document.querySelector('body')?.classList.add('barcode-scanner-active');

      console.log('Starting scan...');

      // Start scanning
      await CapacitorBarcodeScanner.startScan();

      console.log('Scanner started successfully');

    } catch (err) {
      console.error('Start scan error:', err);
      setIsScanning(false);
      setError(t('scanner.startFailed', { error: err?.message || '' }));
      await stopScanner();
    }
  }, [onBarcodeDetected, onClose, stopScanner, t]);

  useEffect(() => {
    const checkAndStartScanner = async () => {
      const native = Capacitor.isNativePlatform();
      setIsNative(native);

      console.log('Is native platform:', native);

      if (native) {
        try {
          // Check if scanning is supported
          const { supported } = await CapacitorBarcodeScanner.isSupported();
          console.log('Barcode scanning supported:', supported);
          setCanScan(supported);

          if (supported) {
            await startNativeScan();
          } else {
            setError(t('scanner.notSupported'));
          }
        } catch (err) {
          console.error('Scanner check error:', err);
          setError(t('scanner.initFailed', { error: err?.message || '' }));
          setCanScan(false);
        }
      } else {
        setError(t('scanner.manualOnly'));
      }
    };

    checkAndStartScanner();

    return () => {
      stopScanner();
    };
  }, [startNativeScan, stopScanner, t]);

  const handleManualLookup = () => {
    if (manualBarcode.trim()) {
      onBarcodeDetected(manualBarcode.trim());
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: isNative && canScan ? 'transparent' : 'rgba(0,0,0,0.9)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#10b981',
        position: 'relative',
        zIndex: 1001
      }}>
        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
          {t('scanner.title')}
        </h2>
        <button
          onClick={async () => {
            await stopScanner();
            onClose();
          }}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={24} color="white" />
        </button>
      </div>

      {/* Scanner Area */}
      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isNative && canScan ? 'transparent' : 'rgba(0,0,0,0.9)'
      }}>
        {isNative && canScan ? (
          <>
            {/* Scanner frame overlay */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80%',
              maxWidth: '400px',
              aspectRatio: '1',
              border: '3px solid #10b981',
              borderRadius: '16px',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
              zIndex: 1000,
              pointerEvents: 'none'
            }}>
              {isScanning && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: '#10b981',
                  animation: 'scan 2s linear infinite',
                  boxShadow: '0 0 10px #10b981'
                }} />
              )}
            </div>

            {/* Status message */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: error ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              maxWidth: '90%',
              textAlign: 'center',
              zIndex: 1001
            }}>
              {isScanning && !error && <Camera size={20} />}
              {isScanning && !error && <span>{t('scanner.pointCamera')}</span>}
              {error && <AlertTriangle size={20} />}
              {error && <span>{error}</span>}
            </div>
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            color: 'white',
            padding: '20px',
            zIndex: 1001
          }}>
            <AlertTriangle size={64} style={{ margin: '0 auto 16px', opacity: 0.7 }} />
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>
              {isNative ? t('scanner.scannerNotAvailable') : t('scanner.cameraOnlyMobile')}
            </p>
            <p style={{ fontSize: '14px', opacity: 0.8 }}>
              {t('scanner.manualEntry')}
            </p>
          </div>
        )}
      </div>

      {/* Manual Input */}
      <div style={{
        padding: '20px',
        backgroundColor: '#1f2937',
        position: 'relative',
        zIndex: 1001
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="tel"
            placeholder={t('scanner.manualPlaceholder')}
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleManualLookup()}
            style={{
              flex: 1,
              padding: '14px',
              border: '2px solid #374151',
              borderRadius: '12px',
              fontSize: '16px',
              outline: 'none',
              backgroundColor: '#374151',
              color: 'white'
            }}
          />
          <button
            onClick={handleManualLookup}
            style={{
              background: '#10b981',
              color: 'white',
              padding: '0 24px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '16px'
            }}
          >
            {t('scanner.lookup')}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        
        body.barcode-scanner-active {
          background: transparent !important;
        }
        
        body.barcode-scanner-active #root {
          display: none !important;
        }
      `}</style>
    </div>
  );
}