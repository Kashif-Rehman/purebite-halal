import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const [openMenu, setOpenMenu] = useState(null);
  const apiMenuRef = useRef(null);
  const languageMenuRef = useRef(null);

  const apiOptions = useMemo(() => ([
    { value: 'auto', label: t('searchBar.api.auto') },
    { value: 'off', label: t('searchBar.api.off') },
    { value: 'spoonacular', label: t('searchBar.api.spoonacular') },
    { value: 'local', label: t('searchBar.api.local') }
  ]), [t]);

  const languageOptions = useMemo(() => ([
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'de', label: 'Deutsch' },
    { value: 'ar', label: 'العربية' },
    { value: 'ur', label: 'اردو' },
    { value: 'fr', label: 'Français' },
    { value: 'it', label: 'Italiano' },
    { value: 'nl', label: 'Nederlands' },
    { value: 'pt', label: 'Português' },
    { value: 'ru', label: 'Русский' },
    { value: 'tr', label: 'Türkçe' },
    { value: 'pl', label: 'Polski' },
    { value: 'el', label: 'Ελληνικά' },
    { value: 'sv', label: 'Svenska' },
    { value: 'no', label: 'Norsk' },
    { value: 'da', label: 'Dansk' },
    { value: 'fi', label: 'Suomi' },
    { value: 'ro', label: 'Română' },
    { value: 'cs', label: 'Čeština' },
    { value: 'hu', label: 'Magyar' },
    { value: 'uk', label: 'Українська' },
    { value: 'bg', label: 'Български' },
    { value: 'sr', label: 'Srpski' },
    { value: 'hi', label: 'हिन्दी' },
    { value: 'bn', label: 'বাংলা' },
    { value: 'id', label: 'Bahasa Indonesia' },
    { value: 'ms', label: 'Bahasa Melayu' },
    { value: 'th', label: 'ไทย' },
    { value: 'vi', label: 'Tiếng Việt' }
  ]), []);

  const selectedApiLabel = useMemo(
    () => apiOptions.find(option => option.value === apiSource)?.label || apiOptions[0].label,
    [apiOptions, apiSource]
  );

  const selectedLanguageLabel = useMemo(
    () => languageOptions.find(option => option.value === language)?.label || languageOptions[0].label,
    [languageOptions, language]
  );

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const clickedApi = apiMenuRef.current?.contains(event.target);
      const clickedLanguage = languageMenuRef.current?.contains(event.target);

      if (!clickedApi && !clickedLanguage) {
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

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
          <div ref={apiMenuRef} style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: '#ecfdf5',
            borderRadius: '12px',
            padding: '6px 12px',
            border: '1.5px solid #10b981'
          }}>
            <Zap size={16} style={{ color: '#10b981', marginRight: '8px' }} />
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'api' ? null : 'api')}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '13px',
                fontWeight: '600',
                color: '#065f46',
                paddingRight: '24px',
                cursor: 'pointer',
                outline: 'none',
                textAlign: 'left'
              }}
            >
              {selectedApiLabel}
            </button>
            <Zap size={14} style={{ 
              position: 'absolute', 
              right: '8px', 
              color: '#10b981', 
              pointerEvents: 'none',
              opacity: 0.7 
            }} />

            {openMenu === 'api' && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                maxHeight: '180px',
                overflowY: 'auto',
                background: '#ecfdf5',
                border: '1.5px solid #10b981',
                borderRadius: '10px',
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                zIndex: 20,
                padding: '4px'
              }}>
                {apiOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setApiSource(option.value);
                      setOpenMenu(null);
                    }}
                    style={{
                      width: '100%',
                      border: 'none',
                      borderRadius: '8px',
                      background: apiSource === option.value ? '#10b981' : 'transparent',
                      color: apiSource === option.value ? 'white' : '#065f46',
                      textAlign: 'left',
                      padding: '8px 10px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
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
          <div ref={languageMenuRef} style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: '#ecfdf5',
            borderRadius: '12px',
            border: '1.5px solid #10b981',
            padding: '6px 12px'
          }}>
            <Globe size={16} style={{ color: '#10b981', marginRight: '8px' }} />
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'language' ? null : 'language')}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '13px',
                fontWeight: '600',
                color: '#065f46',
                paddingRight: '24px',
                cursor: 'pointer',
                outline: 'none',
                textAlign: 'left'
              }}
              aria-label={t('general.language')}
            >
              {selectedLanguageLabel}
            </button>
            <Globe size={14} style={{ 
              position: 'absolute', 
              right: '8px', 
              color: '#10b981', 
              pointerEvents: 'none',
              opacity: 0.7 
            }} />

            {openMenu === 'language' && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                maxHeight: '220px',
                overflowY: 'auto',
                background: '#ecfdf5',
                border: '1.5px solid #10b981',
                borderRadius: '10px',
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                zIndex: 20,
                padding: '4px'
              }}>
                {languageOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setLanguage(option.value);
                      setOpenMenu(null);
                    }}
                    style={{
                      width: '100%',
                      border: 'none',
                      borderRadius: '8px',
                      background: language === option.value ? '#10b981' : 'transparent',
                      color: language === option.value ? 'white' : '#065f46',
                      textAlign: 'left',
                      padding: '8px 10px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                console.log('[SearchBar] Enter pressed, input value:', e.currentTarget.value);
                onSearch(e.currentTarget.value);
              }
            }}
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
          onClick={() => {
            console.log('[SearchBar] Search button clicked, searchQuery state:', searchQuery);
            onSearch(searchQuery);
          }}
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