import React from 'react';
import { useTranslation } from 'react-i18next';

export default function TabNavigation({ activeTab, setActiveTab }) {
  const { t } = useTranslation();
  const tabs = [
    { id: 'search', label: t('tabs.search') },
    { id: 'ecodes', label: t('tabs.ecodes') },
    { id: 'details', label: t('tabs.details') }
  ];

  return (
    <div style={{ 
      display: 'flex', 
      gap: '6px', 
      marginBottom: '12px', 
      overflowX: 'auto', 
      WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }}>
      {tabs.map(tab => (
        <button 
          key={tab.id}
          onClick={() => setActiveTab(tab.id)} 
          style={{ 
            flex: 1, 
            minWidth: '100px', 
            padding: '12px 8px', 
            borderRadius: '12px', 
            border: 'none', 
            fontWeight: '600', 
            cursor: 'pointer', 
            background: activeTab === tab.id ? '#059669' : 'white', 
            color: activeTab === tab.id ? 'white' : '#6b7280', 
            transition: 'all 0.3s', 
            fontSize: '14px', 
            whiteSpace: 'nowrap',
            boxShadow: activeTab === tab.id ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}