import React, { useState, useEffect } from 'react';
import { QrCode, Loader, History, AlertCircle, Info } from 'lucide-react';
import SearchBar from './components/SearchBar';
import ProductCard from './components/ProductCard';
import ProductDetails from './components/ProductDetails';
import BarcodeScanner from './components/BarcodeScanner';
import ECodeList from './components/ECodeList';
import TabNavigation from './components/TabNavigation';
import SplashScreen from './components/SplashScreen';
import About from './components/About';
import { searchProducts, fetchProductByBarcode } from './utils/api';
import { storage } from './utils/storage';
import { localDatabase } from './utils/database';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import './App.css';

export default function App() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('search');
  const [searchHistory, setSearchHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiSource, setApiSource] = useState('auto');
  const [language, setLanguage] = useState('en');
  const [showSplash, setShowSplash] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    loadSavedData();
  }, []);

  useEffect(() => {
    const loadSavedLanguage = async () => {
      const savedLanguage = await storage.getItem('language');
      if (savedLanguage) {
        setLanguage(savedLanguage);
        i18n.changeLanguage(savedLanguage);
      }
    };
    loadSavedLanguage();
  }, []);

  // Save data when it changes
  useEffect(() => {
    storage.setItem('searchHistory', searchHistory);
  }, [searchHistory]);

  useEffect(() => {
    storage.setItem('favorites', favorites);
  }, [favorites]);

  useEffect(() => {
    if (language) {
      i18n.changeLanguage(language);
      storage.setItem('language', language);
    }
  }, [language]);

  const loadSavedData = async () => {
    const savedHistory = await storage.getItem('searchHistory');
    const savedFavorites = await storage.getItem('favorites');

    if (savedHistory) setSearchHistory(savedHistory);
    if (savedFavorites) setFavorites(savedFavorites);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    const results = await searchProducts(searchQuery, apiSource);
    setSearchResults(results);
    setIsLoading(false);

    // Update search history
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
    setSearchHistory(newHistory);
  };

  const handleBarcodeDetected = async (barcode) => {
    setIsLoading(true);

    let product = apiSource !== 'local' ? await fetchProductByBarcode(barcode, apiSource) : null;
    if (!product) {
      product = localDatabase.find(p => p.barcode === barcode);
    }

    setIsLoading(false);

    if (product) {
      selectProduct(product);
      setSearchQuery(product.name);
    } else {
      alert(t('app.barcodeNotFound', { barcode }));
    }
  };

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setActiveTab('details');
  };

  const toggleFavorite = (productId) => {
    const newFavorites = favorites.includes(productId)
      ? favorites.filter(id => id !== productId)
      : [...favorites, productId];
    setFavorites(newFavorites);
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="app-container">
      <div className="app-content">
        {/* About Button */}
        <button 
          className="about-button"
          onClick={() => setShowAbout(true)}
          title="About"
        >
          <Info size={20} />
        </button>

        {/* Search Bar */}
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={handleSearch}
          onScan={() => setShowScanner(true)}
          apiSource={apiSource}
          setApiSource={setApiSource}
          isLoading={isLoading}
          language={language}
          setLanguage={setLanguage}
        />

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content */}
        <div className="content-card">
          {/* Search Tab */}
          {activeTab === 'search' && (
            <div>
              {/* Search History */}
              {!showScanner && searchQuery === '' && searchHistory.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '0 0 8px 0'
                  }}>
                    <History size={16} /> {t('app.recentSearches')}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {searchHistory.slice(0, 5).map((query, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSearchQuery(query);
                          setTimeout(() => handleSearch(), 0);
                        }}
                        style={{
                          padding: '6px 16px',
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: '20px',
                          fontSize: '14px',
                          color: '#374151',
                          cursor: 'pointer'
                        }}
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div style={{ textAlign: 'center', padding: '48px' }}>
                  <Loader
                    size={48}
                    style={{ margin: '0 auto 16px', color: '#10b981' }}
                    className="spin"
                  />
                  <p style={{ color: '#6b7280' }}>
                    {apiSource !== 'local' ? t('app.searching_worldwide') : t('app.searching_local')}
                  </p>
                </div>
              )}

              {/* Empty State */}
              {searchResults.length === 0 && !searchQuery && !isLoading && (
                <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
                  <QrCode size={64} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                  <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', margin: '0 0 8px 0' }}>
                    {t('app.empty.title')}
                  </p>
                  <p style={{ margin: '0 0 20px 0' }}>
                    {t('app.empty.subtitle')}
                  </p>
                  <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    background: apiSource !== 'local' ? '#d1fae5' : '#fef3c7',
                    borderRadius: '12px',
                    fontSize: '14px',
                    color: apiSource !== 'local' ? '#065f46' : '#92400e',
                    textAlign: 'left'
                  }}>
                    {apiSource !== 'local' ? (
                      <>
                        <strong>{t('app.apiBox.realTitle')}</strong><br />
                        {t('app.apiBox.realTry')}<br />
                        {t('app.apiBox.realBarcodes')}
                      </>
                    ) : (
                      <>
                        <strong>{t('app.apiBox.localTitle')}</strong><br />
                        {t('app.apiBox.localTry')}<br />
                        <strong>{t('app.apiBox.localEnable')}</strong>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* No Results */}
              {searchResults.length === 0 && searchQuery && !isLoading && (
                <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
                  <p>
                    {t('app.noResults')} {apiSource === 'local' && t('app.noResultsLocalHint')}
                  </p>
                </div>
              )}

              {/* Search Results */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {searchResults.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => selectProduct(product)}
                    onFavorite={toggleFavorite}
                    isFavorite={favorites.includes(product.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* E-Codes Tab */}
          {activeTab === 'ecodes' && <ECodeList />}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div>
              {selectedProduct ? (
                <ProductDetails product={selectedProduct} />
              ) : (
                <div style={{ textAlign: 'center', padding: '64px' }}>
                  <AlertCircle size={64} style={{ margin: '0 auto 16px', color: '#d1d5db' }} />
                  <p style={{ color: '#6b7280', fontSize: '16px' }}>
                    {t('app.detailsEmpty')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div style={{
          marginTop: '16px',
          background: '#dbeafe',
          borderRadius: '12px',
          padding: '12px'
        }}>
          <p style={{
            fontSize: 'clamp(11px, 2.5vw, 14px)',
            color: '#1e40af',
            lineHeight: '1.5',
            margin: 0
          }}>
            <strong>{t('app.disclaimerTitle')}</strong> {t('app.disclaimerText')}
          </p>
        </div>
      </div>

      {/* About Modal */}
      {showAbout && <About onClose={() => setShowAbout(false)} />}

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onBarcodeDetected={handleBarcodeDetected}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}