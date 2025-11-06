import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Crear cliente de Supabase
export const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

export const connectDB = async () => {
  try {
    // Probar conexión consultando una tabla cualquiera
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    console.log('✅ Conexión a Supabase exitosa');
  } catch (error) {
    console.error('❌ Error al conectar a Supabase:', error);
    throw error;
  }
};

export default supabase;