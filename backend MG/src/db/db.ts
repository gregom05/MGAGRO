import { Pool } from 'pg';
import config from '../config';

// Conexión a Supabase usando la URL completa
const pool = new Pool({
  connectionString: config.supabase.dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión a Supabase PostgreSQL exitosa');
    client.release();
  } catch (error) {
    console.error('❌ Error al conectar a Supabase PostgreSQL:', error);
    throw error;
  }
};

export default pool;