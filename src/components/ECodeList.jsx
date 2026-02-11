import React from 'react';
import { BookOpen } from 'lucide-react';
import { eCodeDatabase } from '../utils/database';
import { getStatusStyles } from '../utils/halalAnalysis';
import { useTranslation } from 'react-i18next';

export default function ECodeList() {
  const { t } = useTranslation();
  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ 
        fontSize: '24px', 
        fontWeight: 'bold', 
        color: '#1f2937', 
        marginBottom: '20px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        margin: '0 0 20px 0'
      }}>
        <BookOpen size={28} /> {t('ecodes.title')}
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {Object.entries(eCodeDatabase).map(([code, info]) => {
          const styles = getStatusStyles(info.status);
          return (
            <div 
              key={code} 
              style={{ 
                padding: '16px', 
                border: '1px solid #e5e7eb', 
                borderRadius: '12px',
                backgroundColor: 'white'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'start',
                gap: '12px'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: '#1f2937', 
                    marginBottom: '4px',
                    margin: '0 0 4px 0'
                  }}>
                    {code}
                  </h3>
                  <p style={{ 
                    fontSize: '16px', 
                    color: '#374151', 
                    marginBottom: '6px',
                    margin: '0 0 6px 0'
                  }}>
                    {info.nameKey ? t(info.nameKey) : info.name}
                  </p>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px', margin: '0 0 4px 0' }}>
                    <strong>{t('ecodes.sourceLabel')}</strong> {info.sourceKey ? t(info.sourceKey) : info.source}
                  </p>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                    ⚠️ {info.concernKey ? t(info.concernKey) : info.concern}
                  </p>
                </div>
                <span style={{ 
                  padding: '6px 16px', 
                  borderRadius: '12px', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  backgroundColor: styles.bg, 
                  color: styles.color, 
                  whiteSpace: 'nowrap' 
                }}>
                  {styles.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      <div style={{ 
        marginTop: '24px', 
        padding: '16px', 
        background: '#fef3c7', 
        borderRadius: '12px' 
      }}>
        <h3 style={{ fontWeight: 'bold', color: '#92400e', marginBottom: '8px', margin: '0 0 8px 0' }}>
          {t('ecodes.importantNoteTitle')}
        </h3>
        <p style={{ fontSize: '14px', color: '#78350f', margin: 0 }}>
          {t('ecodes.importantNoteBody')}
        </p>
      </div>
    </div>
  );
}