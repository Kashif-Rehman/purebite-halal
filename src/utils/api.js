import { analyzeHalalStatus } from './halalAnalysis';
import { analyzeHealthInfo } from './healthAnalysis';
import { localDatabase } from './database';
import { API_CONFIG } from './config';
import i18n from '../i18n';

const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 15000; // Increased from 8000ms to 15000ms for slower networks
const TEXT_SEARCH_TIMEOUT_MS = 15000;
const SEARCH_PAGE_SIZE = 12;
const responseCache = new Map();

const getCached = (key) => {
  const cached = responseCache.get(key);
  if (!cached) {
    console.log('[Cache] Cache MISS for key:', key);
    return null;
  }
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    console.log('[Cache] Cache EXPIRED for key:', key, 'Age:', Date.now() - cached.timestamp, 'ms');
    responseCache.delete(key);
    return null;
  }
  console.log('[Cache] Cache HIT for key:', key, 'Age:', Date.now() - cached.timestamp, 'ms');
  return cached.value;
};

const setCached = (key, value) => {
  console.log('[Cache] Setting cache for key:', key, 'with', value.length, 'items');
  responseCache.set(key, { value, timestamp: Date.now() });
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn('[Fetch] Timeout aborting request to:', url);
    controller.abort();
  }, timeoutMs);
  try {
    console.log('[Fetch] Fetching:', url);
    const response = await fetch(url, { ...options, signal: controller.signal });
    console.log('[Fetch] Response status:', response.status, 'for:', url);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[Fetch] Request aborted for:', url, 'Timeout:', timeoutMs, 'ms');
    } else {
      console.error('[Fetch] Error for:', url, error.message);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const getLocalizedIngredientsText = (product) => {
  const lang = (i18n.language || 'en').toLowerCase();
  const key = `ingredients_text_${lang}`;
  return product[key] || product.ingredients_text || '';
};

export const fetchFromOpenFoodFacts = async (barcode) => {
  const cacheKey = `off:barcode:${barcode}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      { headers: { 'User-Agent': 'HalalFoodChecker/1.0' } }
    );

    if (!response.ok) throw new Error('Product not found');

    const data = await response.json();
    if (data.status === 0 || !data.product) throw new Error('Product not found');

    const product = data.product;
    const ingredientsText = getLocalizedIngredientsText(product);
    const analysis = analyzeHalalStatus(ingredientsText, product.additives_tags);
    const eCodes = (product.additives_tags || [])
      .map(tag => tag.replace('en:', '').toUpperCase())
      .filter(code => code.startsWith('E'));
    const health = analyzeHealthInfo(product);

    const result = {
      id: `api-${barcode}`,
      barcode: barcode,
      name: product.product_name || 'Unknown Product',
      brand: product.brands || 'Unknown Brand',
      category: product.categories || 'Food',
      status: analysis.status,
      reason: analysis.reasonKey,
      reasonKey: analysis.reasonKey,
      reasonParams: analysis.reasonParams,
      ingredients: ingredientsText
        ? ingredientsText.split(',').map(i => i.trim()).slice(0, 10)
        : ['Not available'],
      eCodes: eCodes,
      image: product.image_url,
      source: 'Open Food Facts',
      health: health
    };
    setCached(cacheKey, result);
    return result;
  } catch (error) {
    console.error('OpenFoodFacts Error:', error);
    return null;
  }
};

export const fetchFromSpoonacular = async (barcode) => {
  const { API_KEY, BASE_URL } = API_CONFIG.SPOONACULAR;

  const cacheKey = `spoon:barcode:${barcode}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (API_KEY === 'YOUR_API_KEY') {
    console.warn('Spoonacular API key not configured');
    return null;
  }

  try {
    const response = await fetchWithTimeout(
      `${BASE_URL}/${barcode}?apiKey=${API_KEY}`
    );

    if (!response.ok) throw new Error('Product not found in Spoonacular');

    const product = await response.json();

    // Spoonacular returns ingredients as a list of objects or text
    const ingredientsText = product.ingredientList ||
      (product.ingredients || []).map(i => i.name).join(', ');

    const analysis = analyzeHalalStatus(ingredientsText, []);
    const health = {
      status: 'Unknown',
      color: '#9ca3af',
      issues: [],
      benefits: [],
      score: null
    };

    const result = {
      id: `spoon-${barcode}`,
      barcode: barcode,
      name: product.title || 'Unknown Product',
      brand: product.brand || 'Unknown Brand',
      category: product.aisle || 'Food',
      status: analysis.status,
      reason: analysis.reasonKey,
      reasonKey: analysis.reasonKey,
      reasonParams: analysis.reasonParams,
      ingredients: ingredientsText
        ? ingredientsText.split(',').map(i => i.trim()).slice(0, 10)
        : ['Not available'],
      eCodes: [], // Spoonacular doesn't provide E-codes explicitly
      image: product.image, // Spoonacular often provides a clean product image
      source: 'Spoonacular API',
      health: health
    };
    setCached(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Spoonacular API Error:', error);
    return null;
  }
};

export const searchByName = async (query) => {
  console.log('[searchByName] ENTRY - Query:', query);
  const normalizedQuery = query.trim().toLowerCase();
  
  // CRITICAL: Always clear old search results from cache for this specific query
  // This prevents showing cached results from previous different searches
  const cacheKey = `off:search:${encodeURIComponent(normalizedQuery)}`;
  console.log('[searchByName] Cache key:', cacheKey);
  
  // Check cache ONLY if we have it
  const cached = getCached(cacheKey);
  if (cached) {
    console.log('[searchByName] CACHE HIT! Returning', cached.length, 'cached products:', cached.map(p => p.name));
    return cached;
  }
  console.log('[searchByName] Cache miss, fetching from API...');

  try {
    const encodedQuery = encodeURIComponent(query);
    const requestHeaders = { headers: { 'User-Agent': 'HalalFoodChecker/1.0' } };

    const v2Url = `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodedQuery}&page_size=${SEARCH_PAGE_SIZE}`;
    const legacyUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodedQuery}&page_size=${SEARCH_PAGE_SIZE}&json=true`;

    const fetchAndProcess = async (label, url) => {
      try {
        const response = await fetchWithTimeout(url, requestHeaders, TEXT_SEARCH_TIMEOUT_MS);
        if (!response.ok) {
          console.log(`[searchByName] ${label} API response NOT ok:`, response.status);
          return { results: [], relevantCount: 0 };
        }

        const data = await response.json();
        const rawProducts = data?.products || [];
        console.log(`[searchByName] ${label} API returned`, rawProducts.length, 'products');

        const results = processSearchResults(rawProducts);
        const relevantCount = countRelevantResults(rawProducts, normalizedQuery);
        console.log(`[searchByName] ${label} processed into`, results.length, 'results:', results.map(p => p.name));
        console.log(`[searchByName] ${label} relevant matches:`, relevantCount);
        return { results, relevantCount };
      } catch (error) {
        console.warn(`[searchByName] ${label} search failed:`, error.message);
        return { results: [], relevantCount: 0 };
      }
    };

    const v2Promise = fetchAndProcess('v2', v2Url);
    const legacyPromise = fetchAndProcess('legacy', legacyUrl);

    const firstCompleted = await Promise.race([
      v2Promise.then(payload => ({ source: 'v2', payload })),
      legacyPromise.then(payload => ({ source: 'legacy', payload }))
    ]);

    const isUsable = (source, payload) => {
      if (!payload || payload.results.length === 0) return false;
      return source === 'legacy' || payload.relevantCount > 0;
    };

    if (isUsable(firstCompleted.source, firstCompleted.payload)) {
      setCached(cacheKey, firstCompleted.payload.results);
      console.log(`[searchByName] Cached ${firstCompleted.source} results and returning (early)`);
      return firstCompleted.payload.results;
    }

    const secondPayload = firstCompleted.source === 'v2'
      ? await legacyPromise
      : await v2Promise;

    if (isUsable(firstCompleted.source === 'v2' ? 'legacy' : 'v2', secondPayload)) {
      setCached(cacheKey, secondPayload.results);
      console.log('[searchByName] Cached second-source results and returning');
      return secondPayload.results;
    }

    // Last-resort fallback: return whichever source had results, even if low relevance
    if (firstCompleted.payload.results.length > 0) {
      setCached(cacheKey, firstCompleted.payload.results);
      console.log('[searchByName] Returning first-source fallback results');
      return firstCompleted.payload.results;
    }
    if (secondPayload.results.length > 0) {
      setCached(cacheKey, secondPayload.results);
      console.log('[searchByName] Returning second-source fallback results');
      return secondPayload.results;
    }

    console.log('[searchByName] EXIT - Returning 0 results');
    return [];
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
};

const processSearchResults = (products) => {
  if (!Array.isArray(products)) return [];
  const results = [];

  for (const product of products.slice(0, 20)) {
    if (!product || typeof product !== 'object') continue;

    try {
      const ingredientsText = getLocalizedIngredientsText(product);
      const analysis = analyzeHalalStatus(ingredientsText, product.additives_tags);
      const eCodes = (product.additives_tags || [])
        .map(tag => String(tag).replace('en:', '').toUpperCase())
        .filter(code => code.startsWith('E'));
      const health = analyzeHealthInfo(product);

      results.push({
        id: `api-${product.code || Math.random()}`,
        barcode: product.code || 'N/A',
        name: product.product_name || product.product_name_en || product.generic_name || 'Unknown Product',
        brand: product.brands || 'Unknown Brand',
        category: product.categories_tags?.[0]?.replace('en:', '') || 'Food',
        status: analysis.status,
        reason: analysis.reasonKey,
        reasonKey: analysis.reasonKey,
        reasonParams: analysis.reasonParams,
        ingredients: ingredientsText
          ? ingredientsText.split(',').map(i => i.trim()).slice(0, 15)
          : ['Not available'],
        eCodes: eCodes,
        image: product.image_url || product.image_front_url || product.image_front_small_url,
        source: 'Open Food Facts',
        health: health
      });
    } catch (itemError) {
      console.warn('Skipping malformed product:', itemError);
    }

    if (results.length >= 10) break;
  }

  return results;
};

const countRelevantResults = (products, normalizedQuery) => {
  const tokens = String(normalizedQuery || '').split(/\s+/).filter(Boolean);
  if (tokens.length === 0 || !Array.isArray(products)) return 0;

  let count = 0;
  for (const product of products.slice(0, 20)) {
    const searchable = String([
      product?.product_name,
      product?.product_name_en,
      product?.generic_name,
      product?.brands,
      product?.categories,
      product?.ingredients_text,
      product?.code
    ].join(' ')).toLowerCase();

    if (tokens.some(token => searchable.includes(token))) {
      count++;
    }
  }
  return count;
};

export const fetchProductByBarcode = async (barcode, apiSource = 'auto') => {
  let apiProduct = null;

  // 1. Open Food Facts
  if (apiSource === 'auto' || apiSource === 'off') {
    apiProduct = await fetchFromOpenFoodFacts(barcode);
  }

  // 2. Spoonacular
  if (!apiProduct && (apiSource === 'auto' || apiSource === 'spoonacular')) {
    if (apiSource === 'auto') console.log('Product not found in OFF, trying Spoonacular...');
    apiProduct = await fetchFromSpoonacular(barcode);
  }

  return apiProduct;
};

export const searchProducts = async (query, apiSource = 'auto') => {
  console.log('[searchProducts] ENTRY - Query:', query, 'Source:', apiSource);
  const normalizedQuery = query.trim();
  const numericQuery = normalizedQuery.replace(/\D/g, '');
  const isLikelyBarcode = numericQuery.length >= 8 && numericQuery.length <= 14;
  console.log('[searchProducts] Normalized:', normalizedQuery, 'IsBarcode:', isLikelyBarcode);

  if (!normalizedQuery) {
    console.log('[searchProducts] Empty query, returning empty array');
    return [];
  }

  // For text searches, start with fresh results (not from local DB)
  // This prevents mixing old and new search results
  if (!isLikelyBarcode && apiSource !== 'local') {
    console.log('[searchProducts] Text search - calling searchByName directly');
    try {
      const apiProducts = await searchByName(normalizedQuery);
      console.log('[searchProducts] Got API products from searchByName:', apiProducts.length, apiProducts.map(p => p.name));
      
      // Combine with local DB only if they're not duplicates
      let localResults = localDatabase.filter(p =>
        p.name.toLowerCase().includes(normalizedQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(normalizedQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(normalizedQuery.toLowerCase()) ||
        p.barcode.includes(normalizedQuery)
      );
      console.log('[searchProducts] Local DB results:', localResults.length, localResults.map(r => r.name));
      
      // Combine results, API first, then non-duplicate local results
      let results = [...apiProducts];
      localResults.forEach(lr => {
        if (!results.find(p => p.barcode === lr.barcode && p.barcode !== 'N/A')) {
          results.push(lr);
        }
      });
      
      console.log('[searchProducts] EXIT (Text) - Final results:', results.length, results.map(r => r.name));
      return results;
    } catch (error) {
      console.error('API search failed:', error);
      // Fallback to local DB only if API fails
      let fallbackResults = localDatabase.filter(p =>
        p.name.toLowerCase().includes(normalizedQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(normalizedQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(normalizedQuery.toLowerCase())
      );
      console.log('[searchProducts] EXIT (Text-Fallback) - Final results:', fallbackResults.length, fallbackResults.map(r => r.name));
      return fallbackResults;
    }
  }

  // Barcode or Local-only search
  let results = localDatabase.filter(p =>
    p.name.toLowerCase().includes(normalizedQuery.toLowerCase()) ||
    p.brand.toLowerCase().includes(normalizedQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(normalizedQuery.toLowerCase()) ||
    p.barcode.includes(normalizedQuery)
  );
  console.log('[searchProducts] Local DB results:', results.length, results.map(r => r.name));

  // If Local Only, return immediately
  if (apiSource === 'local') {
    console.log('[searchProducts] Local-only mode, returning:', results.length, 'results');
    return results;
  }

  try {
    if (isLikelyBarcode) {
      // Barcode Search
      const barcode = numericQuery;
      const apiProduct = await fetchProductByBarcode(barcode, apiSource);

      if (apiProduct && !results.find(p => p.barcode === apiProduct.barcode)) {
        results.unshift(apiProduct);
      }
    }
  } catch (error) {
    console.error('API search failed:', error);
  }

  console.log('[searchProducts] EXIT - Final results:', results.length, results.map(r => r.name));
  return results;
};
