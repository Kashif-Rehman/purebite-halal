import { analyzeHalalStatus } from './halalAnalysis';
import { analyzeHealthInfo } from './healthAnalysis';
import { localDatabase } from './database';
import { API_CONFIG } from './config';
import i18n from '../i18n';

const getLocalizedIngredientsText = (product) => {
  const lang = (i18n.language || 'en').toLowerCase();
  const key = `ingredients_text_${lang}`;
  return product[key] || product.ingredients_text || '';
};

export const fetchFromOpenFoodFacts = async (barcode) => {
  try {
    const response = await fetch(
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

    return {
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
  } catch (error) {
    console.error('OpenFoodFacts Error:', error);
    return null;
  }
};

export const fetchFromSpoonacular = async (barcode) => {
  const { API_KEY, BASE_URL } = API_CONFIG.SPOONACULAR;

  if (API_KEY === 'YOUR_API_KEY') {
    console.warn('Spoonacular API key not configured');
    return null;
  }

  try {
    const response = await fetch(
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

    return {
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
  } catch (error) {
    console.error('Spoonacular API Error:', error);
    return null;
  }
};

export const searchByName = async (query) => {
  try {
    const searchResponse = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&page_size=20&json=true`,
      { headers: { 'User-Agent': 'HalalFoodChecker/1.0' } }
    );

    if (!searchResponse.ok) return [];

    const searchData = await searchResponse.json();
    if (!searchData.products || searchData.products.length === 0) return [];

    return searchData.products.slice(0, 10).map(product => {
      const ingredientsText = getLocalizedIngredientsText(product);
      const analysis = analyzeHalalStatus(ingredientsText, product.additives_tags);
      const eCodes = (product.additives_tags || [])
        .map(tag => tag.replace('en:', '').toUpperCase())
        .filter(code => code.startsWith('E'));
      const health = analyzeHealthInfo(product);

      return {
        id: `api-${product.code || Math.random()}`,
        barcode: product.code || 'N/A',
        name: product.product_name || product.product_name_en || 'Unknown Product',
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
      };
    });
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
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
  // Always search local DB first
  let results = localDatabase.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.brand.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase()) ||
    p.barcode.includes(query)
  );

  // If Local Only, return immediately
  if (apiSource === 'local') return results;

  try {
    if (/^\d{8,13}$/.test(query.trim())) {
      // Barcode Search
      const barcode = query.trim();
      const apiProduct = await fetchProductByBarcode(barcode, apiSource);

      if (apiProduct && !results.find(p => p.barcode === apiProduct.barcode)) {
        results.unshift(apiProduct);
      }
    } else {
      // Text Search
      // Currently only supports Open Food Facts for text search
      if (apiSource === 'auto' || apiSource === 'off') {
        const apiProducts = await searchByName(query);
        apiProducts.forEach(ap => {
          if (!results.find(p => p.barcode === ap.barcode && p.barcode !== 'N/A')) {
            results.push(ap);
          }
        });
      }
    }
  } catch (error) {
    console.error('API search failed:', error);
  }

  return results;
};
