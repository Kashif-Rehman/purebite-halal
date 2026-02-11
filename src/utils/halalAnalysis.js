import { eCodeDatabase } from './database';
import i18n from '../i18n';

export const analyzeHalalStatus = (ingredients, additives) => {
  if (!ingredients && !additives) {
    return { status: 'doubtful', reasonKey: 'analysis.no_ingredients' };
  }
  
  const ingredientsLower = (ingredients || '').toLowerCase();
  const additivesArray = additives || [];
  
  const haramKeywords = ['pork', 'bacon', 'ham', 'lard', 'gelatin', 'alcohol', 'wine', 'beer', 'rum'];
  for (const keyword of haramKeywords) {
    if (ingredientsLower.includes(keyword)) {
      return { status: 'haram', reasonKey: 'analysis.contains', reasonParams: { item: keyword } };
    }
  }
  
  let hasHaramECode = false;
  let hasDoubtfulECode = false;
  
  for (const additive of additivesArray) {
    const code = additive.id || additive;
    const eInfo = eCodeDatabase[code];
    if (eInfo) {
      if (eInfo.status === 'haram') hasHaramECode = true;
      if (eInfo.status === 'doubtful') hasDoubtfulECode = true;
    }
  }
  
  if (hasHaramECode) {
    return { status: 'haram', reasonKey: 'analysis.contains_haram_ecodes' };
  }
  
  if (hasDoubtfulECode || ingredientsLower.includes('cheese') || ingredientsLower.includes('enzymes')) {
    return { status: 'doubtful', reasonKey: 'analysis.contains_doubtful' };
  }
  
  return { status: 'halal', reasonKey: 'analysis.no_haram' };
};

export const getStatusStyles = (status) => {
  switch (status) {
    case 'halal': return { color: '#10b981', bg: '#d1fae5', text: i18n.t('status.halal') };
    case 'haram': return { color: '#ef4444', bg: '#fee2e2', text: i18n.t('status.haram') };
    case 'doubtful': return { color: '#f59e0b', bg: '#fef3c7', text: i18n.t('status.doubtful') };
    default: return { color: '#6b7280', bg: '#f3f4f6', text: i18n.t('status.unknown') };
  }
};