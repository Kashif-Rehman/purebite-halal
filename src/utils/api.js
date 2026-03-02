import { analyzeHalalStatus, normalizeECode } from './halalAnalysis';
import { analyzeHealthInfo } from './healthAnalysis';
import { localDatabase } from './database';
import { API_CONFIG } from './config';
import i18n from '../i18n';

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_SIZE = 100; // Prevent unbounded cache growth
const FETCH_TIMEOUT_MS = 15000;
const TEXT_SEARCH_TIMEOUT_MS = 15000;
const SEARCH_PAGE_SIZE = 12;
const responseCache = new Map();
const SEARCH_RETRY_COUNT = 1;
const SEARCH_RETRY_DELAY_MS = 400;

const DEBUG_LOGS = false; // Set to true for verbose logging

const log = (...args) => { if (DEBUG_LOGS) console.log(...args); };
const warn = (...args) => console.warn(...args);

const getCached = (key) => {
  const cached = responseCache.get(key);
  if (!cached) {
    log('[Cache] MISS:', key);
    return null;
  }
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    log('[Cache] EXPIRED:', key);
    responseCache.delete(key);
    return null;
  }
  log('[Cache] HIT:', key);
  return cached.value;
};

const setCached = (key, value) => {
  // Evict oldest entries if cache is full
  if (responseCache.size >= CACHE_MAX_SIZE) {
    const oldestKey = responseCache.keys().next().value;
    responseCache.delete(oldestKey);
    log('[Cache] Evicted oldest entry:', oldestKey);
  }
  log('[Cache] SET:', key, 'items:', value.length);
  responseCache.set(key, { value, timestamp: Date.now() });
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    warn('[Fetch] Timeout aborting:', url);
    controller.abort();
  }, timeoutMs);
  try {
    log('[Fetch]', url);
    const response = await fetch(url, { ...options, signal: controller.signal });
    log('[Fetch] Status:', response.status);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      warn('[Fetch] Aborted:', url);
    } else {
      warn('[Fetch] Error:', error.message);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getLocalizedIngredientsText = (product) => {
  const lang = (i18n.language || 'en').toLowerCase();
  const key = `ingredients_text_${lang}`;
  if (product[key]) return product[key];
  if (product.ingredients_text) return product.ingredients_text;

  if (Array.isArray(product.ingredients) && product.ingredients.length > 0) {
    return product.ingredients
      .map(item => item?.text || item?.id || item)
      .filter(Boolean)
      .join(', ');
  }

  return '';
};

const normalizeAdditivesTags = (additivesTags) => {
  if (Array.isArray(additivesTags)) return additivesTags;
  if (typeof additivesTags === 'string' && additivesTags.trim()) return [additivesTags.trim()];
  if (additivesTags && typeof additivesTags === 'object') {
    return Object.values(additivesTags).filter(Boolean);
  }
  return [];
};

const normalizeForMatch = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const matchesNormalizedQuery = (product, query) => {
  const queryLower = String(query || '').toLowerCase();
  const queryNormalized = normalizeForMatch(queryLower);
  if (!queryLower) return false;

  const fields = [product.name, product.brand, product.category, product.barcode];
  return fields.some(field => {
    const text = String(field || '').toLowerCase();
    const normalizedText = normalizeForMatch(text);
    return text.includes(queryLower) || (queryNormalized.length >= 3 && normalizedText.includes(queryNormalized));
  });
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
    const additivesTags = normalizeAdditivesTags(product.additives_tags);
    const contextText = `${product.product_name || ''} ${product.generic_name || ''} ${product.categories || ''}`;
    const analysis = analyzeHalalStatus(ingredientsText, additivesTags, contextText);
    const eCodes = additivesTags
      .map(tag => normalizeECode(tag))
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
      analysisDetails: analysis.details,
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
    log('OpenFoodFacts not found:', barcode);
    return null;
  }
};

export const fetchFromSpoonacular = async (barcode) => {
  const { API_KEY, BASE_URL } = API_CONFIG.SPOONACULAR;

  const cacheKey = `spoon:barcode:${barcode}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!API_KEY) {
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

    const contextText = `${product.title || ''} ${product.aisle || ''}`;
    const analysis = analyzeHalalStatus(ingredientsText, [], contextText);
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
      analysisDetails: analysis.details,
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
    log('Spoonacular not found:', barcode);
    return null;
  }
};

export const searchByName = async (query) => {
  log('[searchByName] Query:', query);
  const normalizedQuery = query.trim().toLowerCase();
  
  const cacheKey = `off:search:${encodeURIComponent(normalizedQuery)}`;
  
  const cached = getCached(cacheKey);
  if (cached) {
    log('[searchByName] Cache hit:', cached.length, 'products');
    return cached;
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const requestHeaders = { headers: { 'User-Agent': 'HalalFoodChecker/1.0' } };

    // IMPORTANT: Only use legacy search.pl endpoint - the v2 API does NOT support 
    // text search properly (search_terms param is ignored, returns random products)
    const legacyUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodedQuery}&search_simple=1&action=process&page_size=${SEARCH_PAGE_SIZE}&json=1`;

    for (let attempt = 0; attempt <= SEARCH_RETRY_COUNT; attempt++) {
      try {
        const response = await fetchWithTimeout(legacyUrl, requestHeaders, TEXT_SEARCH_TIMEOUT_MS);
        if (!response.ok) {
          log('[searchByName] API not ok:', response.status, 'attempt:', attempt + 1);
          if (attempt < SEARCH_RETRY_COUNT) {
            await delay(SEARCH_RETRY_DELAY_MS);
            continue;
          }
          return [];
        }

        const bodyText = await response.text();
        let data;
        try {
          data = JSON.parse(bodyText);
        } catch (parseError) {
          warn('[searchByName] Invalid JSON attempt', attempt + 1);
          if (attempt < SEARCH_RETRY_COUNT) {
            await delay(SEARCH_RETRY_DELAY_MS);
            continue;
          }
          return [];
        }

        const rawProducts = data?.products || [];
        log('[searchByName] API returned', rawProducts.length, 'products');

        if (rawProducts.length === 0) {
          return [];
        }

        const results = processSearchResults(rawProducts, normalizedQuery);
        log('[searchByName] Processed:', results.length, 'results');
        
        if (results.length > 0) {
          setCached(cacheKey, results);
        }
        return results;
      } catch (error) {
        warn('[searchByName] Failed attempt', attempt + 1, error.message);
        if (attempt < SEARCH_RETRY_COUNT) {
          await delay(SEARCH_RETRY_DELAY_MS);
          continue;
        }
        return [];
      }
    }

    return [];
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
};

const getSearchableProductText = (product) => String([
  product?.product_name,
  product?.product_name_en,
  product?.generic_name,
  product?.brands,
  product?.categories,
  product?.ingredients_text,
  product?.code
].join(' ')).toLowerCase();

const scoreProductRelevance = (product, normalizedQuery) => {
  const query = String(normalizedQuery || '').trim().toLowerCase();
  if (!query) return 0;

  const tokens = query.split(/\s+/).filter(Boolean);
  const name = String(product?.product_name || product?.product_name_en || product?.generic_name || '').toLowerCase();
  const brand = String(product?.brands || '').toLowerCase();
  const searchable = getSearchableProductText(product);

  let score = 0;

  if (name === query) score += 200;
  if (name.startsWith(query)) score += 120;
  if (name.includes(query)) score += 80;
  if (brand.includes(query)) score += 45;

  for (const token of tokens) {
    if (token.length < 2) continue;
    if (name.includes(token)) score += 25;
    if (brand.includes(token)) score += 12;
    if (searchable.includes(token)) score += 6;
  }

  return score;
};

const hasExactBrandMatch = (product, normalizedQuery) => {
  const query = String(normalizedQuery || '').trim().toLowerCase();
  if (!query) return false;

  const rawBrands = String(product?.brands || '').toLowerCase();
  if (!rawBrands) return false;

  const brandParts = rawBrands
    .split(/[,;|/]/)
    .map(part => part.trim())
    .filter(Boolean);

  return brandParts.some(part => part === query) || rawBrands.includes(` ${query} `) || rawBrands.startsWith(`${query} `) || rawBrands.endsWith(` ${query}`);
};

const processSearchResults = (products, normalizedQuery = '') => {
  if (!Array.isArray(products)) return [];
  const results = [];

  const rankedProducts = [...products]
    .slice(0, 60)
    .map(product => ({
      product,
      score: scoreProductRelevance(product, normalizedQuery),
      exactBrandMatch: hasExactBrandMatch(product, normalizedQuery)
    }))
    .sort((a, b) => {
      if (a.exactBrandMatch !== b.exactBrandMatch) {
        return a.exactBrandMatch ? -1 : 1;
      }
      return b.score - a.score;
    })
    .map(item => item.product);

  for (const product of rankedProducts) {
    if (!product || typeof product !== 'object') continue;

    try {
      const ingredientsText = getLocalizedIngredientsText(product);
      const additivesTags = normalizeAdditivesTags(product.additives_tags);
      const contextText = `${product.product_name || ''} ${product.product_name_en || ''} ${product.generic_name || ''} ${product.categories || ''}`;
      const analysis = analyzeHalalStatus(ingredientsText, additivesTags, contextText);
      const eCodes = additivesTags
        .map(tag => normalizeECode(tag))
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
        analysisDetails: analysis.details,
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

export const fetchProductByBarcode = async (barcode, apiSource = 'auto') => {
  let apiProduct = null;

  // 1. Open Food Facts
  if (apiSource === 'auto' || apiSource === 'off') {
    apiProduct = await fetchFromOpenFoodFacts(barcode);
  }

  // 2. Spoonacular
  if (!apiProduct && (apiSource === 'auto' || apiSource === 'spoonacular')) {
    log('Trying Spoonacular fallback...');
    apiProduct = await fetchFromSpoonacular(barcode);
  }

  return apiProduct;
};

export const searchProducts = async (query, apiSource = 'auto') => {
  log('[searchProducts] Query:', query, 'Source:', apiSource);
  const normalizedQuery = query.trim();
  const numericQuery = normalizedQuery.replace(/\D/g, '');
  const isLikelyBarcode = numericQuery.length >= 8 && numericQuery.length <= 14;

  if (!normalizedQuery) {
    return [];
  }

  // For text searches, start with fresh results (not from local DB)
  if (!isLikelyBarcode && apiSource !== 'local') {
    const getLocalMatches = (term) => localDatabase.filter(p => matchesNormalizedQuery(p, term));
    const dedupeByBarcode = (items) => {
      const map = new Map();
      for (const item of items) {
        const key = item?.barcode || item?.id;
        if (!map.has(key)) map.set(key, item);
      }
      return [...map.values()];
    };

    const compactQuery = normalizeForMatch(normalizedQuery);
    const queryTokens = normalizedQuery.split(/\s+/).filter(token => token.length >= 3);
    const queryVariants = [normalizedQuery];
    if (compactQuery && compactQuery !== normalizeForMatch(normalizedQuery)) {
      queryVariants.push(compactQuery);
    }
    if (queryTokens.length > 1) {
      queryVariants.push(queryTokens[0]);
    }

    try {
      let apiProducts = await searchByName(normalizedQuery);
      log('[searchProducts] API results:', apiProducts.length);

      if (apiProducts.length === 0 && queryVariants.length > 1) {
        for (const variant of queryVariants.slice(1)) {
          log('[searchProducts] Trying variant:', variant);
          const variantResults = await searchByName(variant);
          if (variantResults.length > 0) {
            apiProducts = variantResults;
            break;
          }
        }
      }
      
      // Combine with local DB only if they're not duplicates
      let localResults = dedupeByBarcode([
        ...getLocalMatches(normalizedQuery),
        ...getLocalMatches(compactQuery)
      ]);
      log('[searchProducts] Local results:', localResults.length);
      
      // Combine results, API first, then non-duplicate local results
      let results = [...apiProducts];
      localResults.forEach(lr => {
        if (!results.find(p => p.barcode === lr.barcode && p.barcode !== 'N/A')) {
          results.push(lr);
        }
      });
      
      if (results.length === 0) {
        results = localResults;
      }

      log('[searchProducts] Final:', results.length, 'results');
      return results;
    } catch (error) {
      warn('API search failed:', error.message);
      // Fallback to local DB only if API fails
      let fallbackResults = dedupeByBarcode([
        ...getLocalMatches(normalizedQuery),
        ...getLocalMatches(compactQuery)
      ]);
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
  log('[searchProducts] Local matches:', results.length);

  // If Local Only, return immediately
  if (apiSource === 'local') {
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
    warn('Barcode search failed:', error.message);
  }

  log('[searchProducts] Final:', results.length, 'results');
  return results;
};
