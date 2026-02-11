export const localDatabase = [
  { id: 1, barcode: '1234567890123', name: 'Chicken Breast', brand: 'Halal Farms', category: 'Meat', status: 'halal', reason: 'Halal certified slaughter', reasonKey: 'reasons.halal_certified_slaughter', ingredients: ['Chicken'], eCodes: [] },
  { id: 2, barcode: '2345678901234', name: 'Beef Steak', brand: 'Premium Meats', category: 'Meat', status: 'halal', reason: 'Halal certified beef', reasonKey: 'reasons.halal_certified_beef', ingredients: ['Beef'], eCodes: [] },
  { id: 3, barcode: '3456789012345', name: 'Pork Sausage', brand: 'Generic Brand', category: 'Meat', status: 'haram', reason: 'Contains pork', reasonKey: 'reasons.contains_pork', ingredients: ['Pork', 'Spices'], eCodes: [] },
  { id: 5, barcode: '5678901234567', name: 'Fresh Milk', brand: 'Dairy Plus', category: 'Dairy', status: 'halal', reason: 'Pure dairy', reasonKey: 'reasons.pure_dairy', ingredients: ['Milk'], eCodes: [] },
  { id: 6, barcode: '6789012345678', name: 'Cheddar Cheese', brand: 'Cheese Co', category: 'Dairy', status: 'doubtful', reason: 'May contain animal rennet', reasonKey: 'reasons.may_contain_animal_rennet', ingredients: ['Milk', 'Salt', 'Rennet', 'E471'], eCodes: ['E471'] },
  { id: 8, barcode: '8901234567890', name: 'Potato Chips', brand: 'Lays', category: 'Snacks', status: 'halal', reason: 'Vegetable ingredients', reasonKey: 'reasons.vegetable_ingredients', ingredients: ['Potatoes', 'Oil', 'Salt'], eCodes: [] },
  { id: 10, barcode: '0123456789012', name: 'Gummy Bears', brand: 'Haribo', category: 'Candy', status: 'haram', reason: 'Pork gelatin', reasonKey: 'reasons.pork_gelatin', ingredients: ['Sugar', 'Gelatin', 'E120'], eCodes: ['E120'] },
  { id: 11, barcode: '1122334455667', name: 'Coca Cola', brand: 'Coca Cola', category: 'Beverages', status: 'halal', reason: 'No animal ingredients', reasonKey: 'reasons.no_animal_ingredients', ingredients: ['Water', 'Sugar', 'E150d'], eCodes: ['E150d'] },
];

export const eCodeDatabase = {
  'E120': { nameKey: 'ecodes.items.E120.name', status: 'haram', sourceKey: 'ecodes.items.E120.source', concernKey: 'ecodes.items.E120.concern' },
  'E441': { nameKey: 'ecodes.items.E441.name', status: 'haram', sourceKey: 'ecodes.items.E441.source', concernKey: 'ecodes.items.E441.concern' },
  'E542': { nameKey: 'ecodes.items.E542.name', status: 'haram', sourceKey: 'ecodes.items.E542.source', concernKey: 'ecodes.items.E542.concern' },
  'E621': { nameKey: 'ecodes.items.E621.name', status: 'halal', sourceKey: 'ecodes.items.E621.source', concernKey: 'ecodes.items.E621.concern' },
  'E471': { nameKey: 'ecodes.items.E471.name', status: 'doubtful', sourceKey: 'ecodes.items.E471.source', concernKey: 'ecodes.items.E471.concern' },
  'E472e': { nameKey: 'ecodes.items.E472e.name', status: 'doubtful', sourceKey: 'ecodes.items.E472e.source', concernKey: 'ecodes.items.E472e.concern' },
  'E631': { nameKey: 'ecodes.items.E631.name', status: 'doubtful', sourceKey: 'ecodes.items.E631.source', concernKey: 'ecodes.items.E631.concern' },
  'E627': { nameKey: 'ecodes.items.E627.name', status: 'doubtful', sourceKey: 'ecodes.items.E627.source', concernKey: 'ecodes.items.E627.concern' },
  'E150d': { nameKey: 'ecodes.items.E150d.name', status: 'halal', sourceKey: 'ecodes.items.E150d.source', concernKey: 'ecodes.items.E150d.concern' },
  'E338': { nameKey: 'ecodes.items.E338.name', status: 'halal', sourceKey: 'ecodes.items.E338.source', concernKey: 'ecodes.items.E338.concern' },
  'E171': { nameKey: 'ecodes.items.E171.name', status: 'halal', sourceKey: 'ecodes.items.E171.source', concernKey: 'ecodes.items.E171.concern' },
};