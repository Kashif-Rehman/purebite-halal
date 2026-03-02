import React, { useState, useEffect } from 'react';
import { QrCode, Loader, History, AlertCircle, Info } from 'lucide-react';
import SearchBar from './components/SearchBar';
import ProductCard from './components/ProductCard';
import ProductDetails from './components/ProductDetails';
import BarcodeScanner from './components/BarcodeScanner';
import IngredientScanner from './components/IngredientScanner';
import ECodeList from './components/ECodeList';
import TabNavigation from './components/TabNavigation';
import SplashScreen from './components/SplashScreen';
import About from './components/About';
import OfflineBanner from './components/OfflineBanner';
import { ToastContainer, useToasts, showToast } from './components/Toast';
import { searchProducts, fetchProductByBarcode } from './utils/api';
import { storage } from './utils/storage';
import { localDatabase } from './utils/database';
import { analyzeHalalStatus, normalizeECode } from './utils/halalAnalysis';
import { initTaxonomy, isTaxonomyReady, analyzeIngredientFromTaxonomy } from './utils/offTaxonomy';
import { useTranslation } from 'react-i18next';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import i18n from './i18n';
import './App.css';

export default function App() {
  const { t } = useTranslation();
  const { toasts, removeToast } = useToasts();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('search');
  const [searchHistory, setSearchHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showIngredientScanner, setShowIngredientScanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiSource, setApiSource] = useState('auto');
  const [language, setLanguage] = useState('en');
  const [showSplash, setShowSplash] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Network status monitoring
  useEffect(() => {
    let wasOffline = false; // Track previous state to avoid toast on startup

    const checkNetwork = async () => {
      if (Capacitor.isNativePlatform()) {
        const status = await Network.getStatus();
        wasOffline = !status.connected;
        setIsOffline(!status.connected);
      } else {
        wasOffline = !navigator.onLine;
        setIsOffline(!navigator.onLine);
      }
    };

    checkNetwork();

    // Listen for network changes
    if (Capacitor.isNativePlatform()) {
      Network.addListener('networkStatusChange', (status) => {
        const nowOnline = status.connected;
        // Only show toast if we were previously offline and now online
        if (wasOffline && nowOnline) {
          showToast(t('app.backOnline', { defaultValue: 'Back online!' }), 'success');
        }
        wasOffline = !nowOnline;
        setIsOffline(!nowOnline);
      });
    } else {
      window.addEventListener('online', () => {
        if (wasOffline) {
          showToast(t('app.backOnline', { defaultValue: 'Back online!' }), 'success');
        }
        wasOffline = false;
        setIsOffline(false);
      });
      window.addEventListener('offline', () => {
        wasOffline = true;
        setIsOffline(true);
      });
    }

    return () => {
      if (Capacitor.isNativePlatform()) {
        Network.removeAllListeners();
      }
    };
  }, [t]);

  // Load saved data and initialize taxonomy on mount
  useEffect(() => {
    loadSavedData();
    // Pre-load OFF taxonomy in background (non-blocking)
    initTaxonomy().catch(() => {});
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

  const handleSearch = async (queryOverride) => {
    const submittedQuery = (queryOverride ?? searchQuery).trim();

    if (!submittedQuery) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    const results = await searchProducts(submittedQuery, apiSource);
    setSearchResults(results);
    setIsLoading(false);

    // Update search history
    const newHistory = [submittedQuery, ...searchHistory.filter(h => h !== submittedQuery)].slice(0, 10);
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
      showToast(t('app.barcodeNotFound', { barcode }), 'warning');
    }
  };

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setActiveTab('details');
  };

  const handleIngredientAnalyzed = async (ingredientsText) => {
    const cleanedText = String(ingredientsText || '').trim();
    if (!cleanedText) return;

    // Extract E-codes from text
    const eCodeMatches = [...new Set(
      (cleanedText.match(/\bE\s*-?\d{3,4}[a-z]?\b/gi) || [])
        .map(code => normalizeECode(String(code).replace(/\s+/g, '')))
    )];

    // Parse ingredients list
    const ingredients = cleanedText
      .split(/[,;\n]/)
      .map(item => item.trim().replace(/\([^)]*\)/g, '').trim()) // Remove parenthetical notes
      .filter(item => item.length > 1)
      .slice(0, 30);

    // Analyze each ingredient using OFF taxonomy (if loaded)
    const taxonomyDetails = [];
    if (isTaxonomyReady()) {
      for (const ingredient of ingredients) {
        const result = analyzeIngredientFromTaxonomy(ingredient);
        if (result) {
          taxonomyDetails.push({
            ingredient,
            ...result
          });
        }
      }
    }

    // Run main halal analysis
    const analysis = analyzeHalalStatus(cleanedText, eCodeMatches, cleanedText);

    // Enhance analysis details with taxonomy findings
    const enhancedDetails = {
      ...analysis.details,
      taxonomyMatches: taxonomyDetails,
      taxonomySource: isTaxonomyReady() ? 'Open Food Facts' : 'local'
    };

    // Check if taxonomy found anything worse than our local analysis
    const taxonomyHaram = taxonomyDetails.filter(t => t.status === 'haram');
    const taxonomyDoubtful = taxonomyDetails.filter(t => t.status === 'doubtful');
    
    let finalStatus = analysis.status;
    let finalReasonKey = analysis.reasonKey;
    
    // Upgrade status if taxonomy found haram ingredients we missed
    if (taxonomyHaram.length > 0 && finalStatus !== 'haram') {
      finalStatus = 'haram';
      finalReasonKey = 'analysis.contains';
      enhancedDetails.evidence = [
        ...enhancedDetails.evidence,
        ...taxonomyHaram.map(t => `${t.name} (${t.reason})`)
      ];
    } else if (taxonomyDoubtful.length > 0 && finalStatus === 'halal') {
      finalStatus = 'doubtful';
      finalReasonKey = 'analysis.contains_doubtful';
      enhancedDetails.evidence = [
        ...enhancedDetails.evidence,
        ...taxonomyDoubtful.map(t => `${t.name}: source unclear`)
      ];
    }

    const scannedProduct = {
      id: `scan-${Date.now()}`,
      barcode: 'N/A',
      name: t('product.scannedIngredientsTitle', { defaultValue: 'Scanned Ingredients' }),
      brand: t('product.scannedIngredientsBrand', { defaultValue: 'Ingredient Scanner' }),
      category: t('product.scannedIngredientsCategory', { defaultValue: 'Scanned Text' }),
      status: finalStatus,
      reason: finalReasonKey,
      reasonKey: finalReasonKey,
      reasonParams: analysis.reasonParams,
      analysisDetails: enhancedDetails,
      ingredients: ingredients.length > 0 ? ingredients : ['Not available'],
      eCodes: eCodeMatches,
      image: null,
      source: isTaxonomyReady() 
        ? t('product.scannedIngredientsSourceEnhanced', { defaultValue: 'Ingredients Scan + OFF Database' })
        : t('product.scannedIngredientsSource', { defaultValue: 'Ingredients Scan' }),
      health: { issues: [], benefits: [], score: null }
    };

    setSearchQuery(t('product.scannedIngredientsQuery', { defaultValue: 'scanned ingredients' }));
    setSearchResults([scannedProduct]);
    selectProduct(scannedProduct);
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
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="app-content">
        {/* Offline Banner */}
        {isOffline && <OfflineBanner />}

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
          onScanIngredients={() => setShowIngredientScanner(true)}
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
                          setTimeout(() => handleSearch(query), 0);
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
                  <p style={{ margin: '0 0 12px 0' }}>
                    {t('app.noResults')} {apiSource === 'local' && t('app.noResultsLocalHint')}
                  </p>
                  <div style={{
                    display: 'inline-block',
                    textAlign: 'left',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    fontSize: '13px',
                    color: '#4b5563'
                  }}>
                    <p style={{ margin: '0 0 6px 0', fontWeight: '600', color: '#374151' }}>
                      {t('app.noResultsTipsTitle', { defaultValue: 'Try this:' })}
                    </p>
                    <p style={{ margin: '0 0 4px 0' }}>• {t('app.noResultsTipBrand', { defaultValue: 'Search by brand name (e.g., Oreo, Nutella)' })}</p>
                    <p style={{ margin: '0 0 4px 0' }}>• {t('app.noResultsTipSpelling', { defaultValue: 'Try a shorter or corrected spelling' })}</p>
                    <p style={{ margin: '0' }}>• {t('app.noResultsTipBarcode', { defaultValue: 'Scan barcode for best accuracy' })}</p>
                  </div>
                </div>
              )}

              {/* Search Results */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {searchResults.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => selectProduct(product)}
                    onFavorite={toggleFavorite}
                    isFavorite={favorites.includes(product.id)}
                    isBestMatch={idx === 0 && searchQuery.trim().length >= 3}
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

      {/* Ingredient Scanner Modal */}
      {showIngredientScanner && (
        <IngredientScanner
          onClose={() => setShowIngredientScanner(false)}
          onAnalyze={(text) => {
            handleIngredientAnalyzed(text);
            setShowIngredientScanner(false);
          }}
        />
      )}
    </div>
  );
}