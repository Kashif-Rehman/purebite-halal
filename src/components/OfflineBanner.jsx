import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function OfflineBanner({ onRetry }) {
  const { t } = useTranslation();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '12px 16px',
      background: '#fef3c7',
      borderRadius: '12px',
      marginBottom: '16px',
      border: '1px solid #fcd34d'
    }}>
      <WifiOff size={20} style={{ color: '#b45309', flexShrink: 0 }} />
      <span style={{ color: '#92400e', fontSize: '14px', fontWeight: '500' }}>
        {t('app.offlineMessage', { defaultValue: 'You are offline. Some features may be unavailable.' })}
      </span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          <RefreshCw size={14} />
          {t('app.retry', { defaultValue: 'Retry' })}
        </button>
      )}
    </div>
  );
}
