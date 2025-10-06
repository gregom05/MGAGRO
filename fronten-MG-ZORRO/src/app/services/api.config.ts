// Detectar si estamos en desarrollo o producción
const isProduction = window.location.hostname !== 'localhost';

export const API_BASE_URL = isProduction 
  ? 'https://mgagro-backend.vercel.app/api'
  : 'http://localhost:3000/api';
