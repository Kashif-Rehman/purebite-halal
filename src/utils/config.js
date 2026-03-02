export const API_CONFIG = {
    // Get your free key at https://spoonacular.com/food-api
    SPOONACULAR: {
        API_KEY: process.env.REACT_APP_SPOONACULAR_API_KEY || '',
        BASE_URL: 'https://api.spoonacular.com/food/products/upc'
    },
    // Edamam configuration (Optional/Backup)
    EDAMAM: {
        APP_ID: process.env.REACT_APP_EDAMAM_APP_ID || '',
        APP_KEY: process.env.REACT_APP_EDAMAM_APP_KEY || '',
        BASE_URL: 'https://api.edamam.com/api/food-database/v2/parser'
    }
};
