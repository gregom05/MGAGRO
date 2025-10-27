import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import empleadosRoutes from './routes/empleados.routes';
import actividadesRoutes from './routes/actividades.routes';
import articulosRoutes from './routes/articulos.routes';
import movimientosRoutes from './routes/movimientos.routes';
import usuariosRoutes from './routes/usuarios.routes';
import { connectDB } from './db/db';
import { initializeDB } from './db/initDB';
import config from './config';

dotenv.config();

const app = express();
const PORT = config.port;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Inicializar base de datos solo una vez
let dbInitialized = false;
const initDB = async () => {
  if (!dbInitialized) {
    try {
      await connectDB();
      console.log('📦 Inicializando tablas en Supabase...');
      await initializeDB();
      dbInitialized = true;
      console.log('✅ Base de datos inicializada');
    } catch (error) {
      console.error('❌ Error al conectar a la base de datos:', error);
    }
  }
};

// Inicializar DB (no bloqueante)
initDB();

// Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/actividades', actividadesRoutes);
app.use('/api/articulos', articulosRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({ 
    message: 'API MG AGRO - Sistema de Gestión',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      empleados: '/api/empleados',
      actividades: '/api/actividades',
      articulos: '/api/articulos',
  movimientos: '/api/movimientos',
  usuarios: '/api/usuarios'
    }
  });
});

// Levantar el servidor (solo en desarrollo local)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📚 Documentación: http://localhost:${PORT}/`);
  });
}

// Exportar para Vercel
export default app;