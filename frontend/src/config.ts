export const API_URL = process.env.NODE_ENV === 'production'
  ? process.env.REACT_APP_API_URL  // Берем из переменных окружения на Vercel
  : 'http://localhost:3001';        // Локально используем localhost

// Для отладки (можно добавить)
console.log('🔧 API_URL:', API_URL, 'NODE_ENV:', process.env.NODE_ENV);