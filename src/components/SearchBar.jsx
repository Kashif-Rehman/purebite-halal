import React from 'react';
import { Search, Camera, Globe, Zap, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  onSearch,
  onScan,
  apiSource,
  setApiSource,
  isLoading,
  language,
  setLanguage
}) {
  const { t } = useTranslation();

  return (
    <div style={{
      background: 'white',
      borderRadius: '24px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      padding: '16px',
      marginBottom: '16px'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h1 style={{
          fontSize: 'clamp(24px, 6vw, 32px)',
          fontWeight: 'bold',
          color: '#065f46',
          marginBottom: '8px',
          margin: 0
        }}>
          🕌 {t('general.appName')}
        </h1>
        <p style={{ color: '#6b7280', fontSize: 'clamp(13px, 3vw, 16px)', margin: '8px 0' }}>
          {t('searchBar.subtitle')}
        </p>

        {/* API Selection */}
        <div style={{
          marginTop: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: '#f3f4f6',
            borderRadius: '12px',
            padding: '4px 12px',
            border: '1px solid #e5e7eb'
          }}>
            <Globe size={16} style={{ color: '#4b5563', marginRight: '8px' }} />
            <select
              value={apiSource}
              onChange={(e) => setApiSource(e.target.value)}
              style={{
                appearance: 'none',
                background: 'transparent',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                paddingRight: '24px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="auto">{t('searchBar.api.auto')}</option>
              <option value="off">{t('searchBar.api.off')}</option>
              <option value="spoonacular">{t('searchBar.api.spoonacular')}</option>
              <option value="local">{t('searchBar.api.local')}</option>
            </select>
          </div>
        </div>

        {/* Language Selection */}
        <div style={{
          marginTop: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>
            {t('general.language')}
          </span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              appearance: 'none',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              padding: '4px 10px',
              cursor: 'pointer',
              outline: 'none'
            }}
            aria-label={t('general.language')}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="de">Deutsch</option>
            <option value="ar">العربية</option>
            <option value="ur">اردو</option>
            <option value="fr">Français</option>
            <option value="it">Italiano</option>
            <option value="nl">Nederlands</option>
            <option value="pt">Português</option>
            <option value="ru">Русский</option>
            <option value="tr">Türkçe</option>
            <option value="pl">Polski</option>
            <option value="el">Ελληνικά</option>
            <option value="sv">Svenska</option>
            <option value="no">Norsk</option>
            <option value="da">Dansk</option>
            <option value="fi">Suomi</option>
            <option value="ro">Română</option>
            <option value="cs">Čeština</option>
            <option value="hu">Magyar</option>
            <option value="uk">Українська</option>
            <option value="bg">Български</option>
            <option value="sr">Srpski</option>
            <option value="hi">हिन्दी</option>
            <option value="bn">বাংলা</option>
            <option value="id">Bahasa Indonesia</option>
            <option value="ms">Bahasa Melayu</option>
            <option value="th">ไทย</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </div>

        {apiSource !== 'local' && (
          <div style={{
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: 'clamp(11px, 2.5vw, 13px)',
            color: '#059669'
          }}>
            <Zap size={14} />
            <span>
              {apiSource === 'auto' ? t('searchBar.apiStatus.auto') :
                apiSource === 'off' ? t('searchBar.apiStatus.off') :
                  t('searchBar.apiStatus.spoonacular')}
            </span>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexDirection: window.innerWidth < 640 ? 'column' : 'row'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          {isLoading ? (
            <Loader
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#10b981'
              }}
              size={20}
              className="spin"
            />
          ) : (
            <Search
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }}
              size={20}
            />
          )}
          <input
            type="text"
            placeholder={apiSource !== 'local' ? t('searchBar.placeholder.any') : t('searchBar.placeholder.local')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            style={{
              width: '100%',
              paddingLeft: '44px',
              paddingRight: '12px',
              paddingTop: '14px',
              paddingBottom: '14px',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '16px',
              outline: 'none',
              WebkitAppearance: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#10b981'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>
        <button
          onClick={onSearch}
          style={{
            background: '#10b981',
            color: 'white',
            padding: '0 24px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '16px',
            minHeight: '50px',
            whiteSpace: 'nowrap'
          }}
        >
          {t('searchBar.buttons.search')}
        </button>
        <button
          onClick={onScan}
          style={{
            background: '#059669',
            color: 'white',
            padding: '0 20px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: '600',
            fontSize: '16px',
            minHeight: '50px',
            whiteSpace: 'nowrap'
          }}
        >
          <Camera size={20} />
          <span>{t('searchBar.buttons.scan')}</span>
        </button>
      </div>
    </div>
  );
}