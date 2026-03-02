import { eCodeDatabase } from './database';
import { lookupAdditive, lookupIngredient, mapToHalalStatus, isTaxonomyReady } from './offTaxonomy';
import i18n from '../i18n';

export const normalizeECode = (code) => {
  const normalized = String(code || '').replace(/^en:/i, '').trim().toUpperCase();
  const match = normalized.match(/^E(\d+)([A-Z])$/);
  if (match) {
    return `E${match[1]}${match[2].toLowerCase()}`;
  }
  return normalized;
};

/**
 * Get E-code info from local database OR OFF taxonomy
 */
export const getECodeInfo = (code) => {
  const normalized = normalizeECode(code);
  
  // Check local database first
  const localInfo = eCodeDatabase[normalized] || eCodeDatabase[normalized.toUpperCase()];
  if (localInfo) return localInfo;
  
  // Fallback to OFF taxonomy if loaded
  if (isTaxonomyReady()) {
    const offInfo = lookupAdditive(normalized);
    if (offInfo) {
      const status = mapToHalalStatus(offInfo.vegan, offInfo.vegetarian);
      return {
        name: offInfo.name,
        status: status || 'doubtful',
        source: 'OFF Taxonomy',
        concern: offInfo.vegan === 'maybe' ? 'Source unclear (may be plant or animal)' : 
                 offInfo.vegetarian === 'no' ? 'Animal/meat-based' : 
                 'Check manufacturer'
      };
    }
  }
  
  return null;
};

const collectEvidenceMatches = (text, patterns) => {
  const found = [];
  for (const { label, regex } of patterns) {
    if (regex.test(text)) {
      found.push(label);
    }
  }
  return [...new Set(found)];
};

const getConfidenceLevel = (score) => {
  if (score >= 80) return 'high';
  if (score >= 55) return 'medium';
  return 'low';
};

const buildConfidence = (score) => ({
  score,
  level: getConfidenceLevel(score)
});

export const analyzeHalalStatus = (ingredients, additives, contextText = '') => {
  const ingredientsText = String(ingredients || '');
  const additivesArray = additives || [];
  const combinedText = `${ingredientsText} ${contextText}`.toLowerCase();
  const hasHalalCertificationMention = /\b(halal|zabihah|zabiha|halal-certified|halal certified)\b/i.test(combinedText);

  if (!ingredientsText.trim() && additivesArray.length === 0) {
    return {
      status: 'doubtful',
      reasonKey: 'analysis.no_ingredients',
      details: {
        evidence: ['ingredients_unavailable'],
        haramECodes: [],
        doubtfulECodes: [],
        confidence: buildConfidence(30)
      }
    };
  }

  const strictHaramPatterns = [
    { label: 'pork', regex: /\b(pork|porcine|pig|swine|boar|lard|bacon|ham|prosciutto|pepperoni)\b/i },
    { label: 'alcohol', regex: /\b(alcohol|ethanol|wine|beer|rum|vodka|whisky|whiskey|brandy|liqueur)\b/i },
    { label: 'blood', regex: /\b(blood|blood plasma)\b/i }
  ];

  const doubtfulIngredientPatterns = [
    { label: 'Gelatin is often sourced from pork unless halal bovine/fish source is specified', regex: /\bgelatin\b/i },
    { label: 'Rennet source is unclear (may be animal or microbial)', regex: /\brennet\b/i },
    { label: 'Enzyme source is unclear', regex: /\benzymes?\b/i },
    { label: 'Mono/Diglycerides may come from plant oil or animal fat', regex: /\bmono\s*[- ]?diglycerides?\b/i },
    { label: 'Glycerin/Glycerol source may be plant or animal', regex: /\bglycerin|glycerol\b/i }
  ];

  const strictEvidence = collectEvidenceMatches(combinedText, strictHaramPatterns);
  const doubtfulEvidence = collectEvidenceMatches(combinedText, doubtfulIngredientPatterns);

  if (!hasHalalCertificationMention && /\bbeef\b/i.test(combinedText)) {
    doubtfulEvidence.push('Beef requires halal certification; in many Europe/America products slaughter method may not be halal');
  }

  const haramECodes = [];
  const doubtfulECodes = [];

  for (const additive of additivesArray) {
    const rawCode = additive?.id || additive;
    const normalizedCode = normalizeECode(rawCode);
    const eInfo = getECodeInfo(normalizedCode);

    if (!eInfo) continue;
    if (eInfo.status === 'haram') haramECodes.push(normalizedCode);
    if (eInfo.status === 'doubtful') doubtfulECodes.push(normalizedCode);
  }

  if (strictEvidence.length > 0) {
    return {
      status: 'haram',
      reasonKey: 'analysis.contains',
      reasonParams: { item: strictEvidence.join(', ') },
      details: {
        evidence: strictEvidence,
        haramECodes: [...new Set(haramECodes)],
        doubtfulECodes: [...new Set(doubtfulECodes)],
        confidence: buildConfidence(95)
      }
    };
  }

  if (haramECodes.length > 0) {
    return {
      status: 'haram',
      reasonKey: 'analysis.contains_haram_ecodes',
      details: {
        evidence: [],
        haramECodes: [...new Set(haramECodes)],
        doubtfulECodes: [...new Set(doubtfulECodes)],
        confidence: buildConfidence(90)
      }
    };
  }

  if (doubtfulECodes.length > 0 || doubtfulEvidence.length > 0) {
    const confidenceScore = doubtfulEvidence.length > 0 || doubtfulECodes.length > 0 ? 58 : 50;
    return {
      status: 'doubtful',
      reasonKey: 'analysis.contains_doubtful',
      details: {
        evidence: doubtfulEvidence,
        haramECodes: [],
        doubtfulECodes: [...new Set(doubtfulECodes)],
        confidence: buildConfidence(confidenceScore)
      }
    };
  }

  return {
    status: 'halal',
    reasonKey: 'analysis.no_haram',
    details: {
      evidence: [],
      haramECodes: [],
      doubtfulECodes: [],
      confidence: buildConfidence(74)
    }
  };
};

/**
 * Analyze a single ingredient using OFF taxonomy
 * Returns { status, reason } or null if not found
 */
export const analyzeIngredientWithTaxonomy = (ingredientText) => {
  const normalized = String(ingredientText || '').toLowerCase().trim().replace(/\s+/g, '-');
  
  if (!isTaxonomyReady()) return null;
  
  const lookup = lookupIngredient(normalized);
  if (!lookup) return null;
  
  const status = mapToHalalStatus(lookup.vegan, lookup.vegetarian);
  if (!status) return null;
  
  return {
    status,
    name: lookup.name,
    vegan: lookup.vegan,
    vegetarian: lookup.vegetarian,
    source: 'OFF Taxonomy'
  };
};

export const getStatusStyles = (status) => {
  switch (status) {
    case 'halal': return { color: '#10b981', bg: '#d1fae5', text: i18n.t('status.halal') };
    case 'haram': return { color: '#ef4444', bg: '#fee2e2', text: i18n.t('status.haram') };
    case 'doubtful': return { color: '#f59e0b', bg: '#fef3c7', text: i18n.t('status.doubtful') };
    default: return { color: '#6b7280', bg: '#f3f4f6', text: i18n.t('status.unknown') };
  }
};