// Detectar si estamos en desarrollo o producción
const isLocal = window.location.hostname === 'localhost';

export const API_BASE_URL = isLocal
	? 'http://localhost:3000/api'
	: 'https://mgagro-backend.vercel.app/api';
