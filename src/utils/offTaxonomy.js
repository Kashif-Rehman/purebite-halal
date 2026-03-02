/**
 * Open Food Facts Taxonomy Integration
 * 
 * Uses OFF's ingredient and additive taxonomies to improve halal analysis.
 * Maps vegan/vegetarian status to halal classification:
 * - vegetarian: "no" → haram (meat-based)
 * - vegan: "no" → doubtful (animal-derived but may be halal)
 * - vegan/vegetarian: "maybe" → doubtful (source unclear)
 * - vegan: "yes" → halal (plant-based)
 */

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const TAXONOMY_URLS = {
  ingredients: 'https://world.openfoodfacts.org/data/taxonomies/ingredients.json',
  additives: 'https://world.openfoodfacts.org/data/taxonomies/additives.json'
};

// In-memory cache
let taxonomyCache = {
  ingredients: null,
  additives: null,
  timestamp: 0
};

// LocalStorage cache key
const CACHE_KEY = 'off_taxonomy_cache';

/**
 * Load taxonomy from localStorage if available and not expired
 */
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    if (Date.now() - data.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
};

/**
 * Save taxonomy to localStorage
 */
const saveToStorage = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    // Storage might be full or unavailable - ignore
  }
};

/**
 * Fetch a single taxonomy with timeout
 */
const fetchTaxonomy = async (type) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch(TAXONOMY_URLS[type], {
      signal: controller.signal,
      headers: { 'User-Agent': 'HalalFoodChecker/1.0' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Initialize taxonomy data (fetch from OFF or load from cache)
 */
export const initTaxonomy = async () => {
  // Check in-memory cache first
  if (taxonomyCache.ingredients && taxonomyCache.additives) {
    if (Date.now() - taxonomyCache.timestamp < CACHE_TTL_MS) {
      return true;
    }
  }
  
  // Try localStorage
  const stored = loadFromStorage();
  if (stored) {
    taxonomyCache = stored;
    return true;
  }
  
  // Fetch from OFF
  try {
    const [ingredients, additives] = await Promise.all([
      fetchTaxonomy('ingredients'),
      fetchTaxonomy('additives')
    ]);
    
    taxonomyCache = {
      ingredients,
      additives,
      timestamp: Date.now()
    };
    
    saveToStorage(taxonomyCache);
    console.log('[Taxonomy] Loaded:', Object.keys(ingredients).length, 'ingredients,', Object.keys(additives).length, 'additives');
    return true;
  } catch (error) {
    console.warn('[Taxonomy] Failed to load:', error.message);
    return false;
  }
};

/**
 * Normalize an ingredient/additive ID for lookup
 */
const normalizeId = (text) => {
  const cleaned = String(text || '')
    .toLowerCase()
    .trim()
    .replace(/^en:/, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
  
  return `en:${cleaned}`;
};

/**
 * Normalize E-code for lookup (e.g., "E120" -> "en:e120")
 */
const normalizeECodeId = (code) => {
  const cleaned = String(code || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/^en:/, '');
  
  // Ensure it starts with 'e' and has numbers
  if (/^e\d+/.test(cleaned)) {
    return `en:${cleaned}`;
  }
  return null;
};

/**
 * Look up an ingredient in the taxonomy
 * @returns {Object|null} { vegan, vegetarian, name, parents }
 */
export const lookupIngredient = (ingredientText) => {
  if (!taxonomyCache.ingredients) return null;
  
  const id = normalizeId(ingredientText);
  const data = taxonomyCache.ingredients[id];
  
  if (!data) return null;
  
  return {
    id,
    name: data.name?.en || ingredientText,
    vegan: data.vegan?.en || null,
    vegetarian: data.vegetarian?.en || null,
    parents: data.parents || []
  };
};

/**
 * Look up an E-code/additive in the taxonomy
 * @returns {Object|null} { vegan, vegetarian, name }
 */
export const lookupAdditive = (eCode) => {
  if (!taxonomyCache.additives) return null;
  
  const id = normalizeECodeId(eCode);
  if (!id) return null;
  
  const data = taxonomyCache.additives[id];
  
  if (!data) return null;
  
  return {
    id,
    name: data.name?.en || eCode,
    vegan: data.vegan?.en || null,
    vegetarian: data.vegetarian?.en || null
  };
};

/**
 * Map vegan/vegetarian status to halal classification
 * 
 * Logic:
 * - vegetarian: "no" → haram (meat-based like carmine from insects)
 * - vegan: "no" + vegetarian: not "no" → doubtful (could be halal animal like eggs/milk)
 * - vegan: "maybe" or vegetarian: "maybe" → doubtful (source unclear)
 * - vegan: "yes" → halal (plant-based)
 * - Unknown → null (use fallback)
 */
export const mapToHalalStatus = (veganStatus, vegetarianStatus) => {
  const vegan = String(veganStatus || '').toLowerCase();
  const vegetarian = String(vegetarianStatus || '').toLowerCase();
  
  // Meat-based (not vegetarian) = likely haram
  if (vegetarian === 'no') {
    return 'haram';
  }
  
  // Animal-derived but vegetarian (eggs, milk, honey) = generally halal
  // But insects (carmine) are vegetarian:no
  if (vegan === 'no' && vegetarian !== 'no') {
    // Animal byproduct but not meat - generally halal
    return 'halal';
  }
  
  // Source unclear = doubtful
  if (vegan === 'maybe' || vegetarian === 'maybe') {
    return 'doubtful';
  }
  
  // Plant-based = halal
  if (vegan === 'yes') {
    return 'halal';
  }
  
  // Unknown
  return null;
};

/**
 * Check an ingredient and return halal analysis
 * @returns {Object|null} { status, name, reason, source }
 */
export const analyzeIngredientFromTaxonomy = (ingredientText) => {
  // Check as ingredient first
  let lookup = lookupIngredient(ingredientText);
  
  // If not found, try as additive (E-code)
  if (!lookup && /e\s*\d+/i.test(ingredientText)) {
    lookup = lookupAdditive(ingredientText);
  }
  
  if (!lookup) return null;
  
  const status = mapToHalalStatus(lookup.vegan, lookup.vegetarian);
  if (!status) return null;
  
  return {
    status,
    name: lookup.name,
    vegan: lookup.vegan,
    vegetarian: lookup.vegetarian,
    reason: buildReason(lookup, status),
    source: 'Open Food Facts'
  };
};

/**
 * Build a human-readable reason
 */
const buildReason = (lookup, status) => {
  if (status === 'haram') {
    if (lookup.vegetarian === 'no') {
      return `${lookup.name} is meat/animal-based (not vegetarian)`;
    }
  }
  
  if (status === 'doubtful') {
    return `${lookup.name} source is unclear (may be plant or animal)`;
  }
  
  if (status === 'halal') {
    if (lookup.vegan === 'yes') {
      return `${lookup.name} is plant-based`;
    }
    if (lookup.vegan === 'no' && lookup.vegetarian !== 'no') {
      return `${lookup.name} is animal byproduct (vegetarian)`;
    }
  }
  
  return null;
};

/**
 * Batch analyze multiple ingredients
 * @returns {Array} Array of { ingredient, analysis }
 */
export const analyzeIngredientsBatch = async (ingredients) => {
  await initTaxonomy();
  
  return ingredients.map(ingredient => ({
    ingredient,
    analysis: analyzeIngredientFromTaxonomy(ingredient)
  }));
};

/**
 * Check if taxonomy is loaded
 */
export const isTaxonomyReady = () => {
  return !!(taxonomyCache.ingredients && taxonomyCache.additives);
};

/**
 * Get taxonomy stats
 */
export const getTaxonomyStats = () => {
  return {
    ingredients: taxonomyCache.ingredients ? Object.keys(taxonomyCache.ingredients).length : 0,
    additives: taxonomyCache.additives ? Object.keys(taxonomyCache.additives).length : 0,
    timestamp: taxonomyCache.timestamp,
    isLoaded: isTaxonomyReady()
  };
};

// Haram ingredients that are always haram regardless of OFF status
const ALWAYS_HARAM = [
  'pork', 'porcine', 'pig', 'swine', 'lard', 'bacon', 'ham',
  'alcohol', 'wine', 'beer', 'vodka', 'whisky', 'rum', 'brandy',
  'blood', 'blood-plasma'
];

/**
 * Enhanced halal analysis using taxonomy + local rules
 */
export const getHalalStatusFromTaxonomy = async (ingredientText) => {
  const normalized = String(ingredientText || '').toLowerCase().trim();
  
  // Always haram check (overrides everything)
  if (ALWAYS_HARAM.some(term => normalized.includes(term))) {
    return {
      status: 'haram',
      reason: `Contains ${normalized}`,
      source: 'local-rule'
    };
  }
  
  // Try taxonomy lookup
  await initTaxonomy();
  const taxonomyResult = analyzeIngredientFromTaxonomy(normalized);
  
  if (taxonomyResult) {
    return taxonomyResult;
  }
  
  // Not found in taxonomy
  return null;
};
