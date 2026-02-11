export const analyzeHealthInfo = (product) => {
  const nutrients = product.nutriments || {};
  const nova = product.nova_group;
  const nutriscore = product.nutriscore_grade;
  
  const healthIssues = [];
  const healthBenefits = [];
  
  if (nutrients['sugars_100g'] > 15) {
    healthIssues.push({ key: 'health.high_sugar', value: nutrients['sugars_100g'] });
  } else if (nutrients['sugars_100g'] < 5) {
    healthBenefits.push({ key: 'health.low_sugar' });
  }
  
  if (nutrients['salt_100g'] > 1.5) {
    healthIssues.push({ key: 'health.high_salt', value: nutrients['salt_100g'] });
  } else if (nutrients['salt_100g'] < 0.3) {
    healthBenefits.push({ key: 'health.low_salt' });
  }
  
  if (nutrients['saturated-fat_100g'] > 5) {
    healthIssues.push({ key: 'health.high_sat_fat', value: nutrients['saturated-fat_100g'] });
  }
  
  if (nutrients['fiber_100g'] > 6) {
    healthBenefits.push({ key: 'health.good_fiber', value: nutrients['fiber_100g'] });
  }
  
  if (nutrients['proteins_100g'] > 10) {
    healthBenefits.push({ key: 'health.high_protein', value: nutrients['proteins_100g'] });
  }
  
  if (nova === 4) {
    healthIssues.push({ key: 'health.ultra_processed' });
  } else if (nova === 1) {
    healthBenefits.push({ key: 'health.minimally_processed' });
  }
  
  const nutriscoreInfo = {
    'a': { key: 'health.nutriscore.excellent', color: '#038141', grade: 'a' },
    'b': { key: 'health.nutriscore.good', color: '#85bb2f', grade: 'b' },
    'c': { key: 'health.nutriscore.average', color: '#fecb02', grade: 'c' },
    'd': { key: 'health.nutriscore.poor', color: '#ee8100', grade: 'd' },
    'e': { key: 'health.nutriscore.very_poor', color: '#e63e11', grade: 'e' }
  };
  
  return {
    score: nutriscore ? nutriscoreInfo[nutriscore] : null,
    issues: healthIssues,
    benefits: healthBenefits,
    calories: nutrients['energy-kcal_100g'],
    fat: nutrients['fat_100g'],
    carbs: nutrients['carbohydrates_100g'],
    protein: nutrients['proteins_100g'],
    fiber: nutrients['fiber_100g'],
    sugar: nutrients['sugars_100g'],
    salt: nutrients['salt_100g']
  };
};