import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testConnection() {
  // Cambia 'movimientosinventario' por el nombre de una tabla existente si es necesario
  const { data, error } = await supabase.from('movimientosinventario').select('*').limit(1);
  if (error) {
    console.error('❌ Error al consultar Supabase:', error.message);
  } else {
    console.log('✅ Conexión exitosa. Primer registro:', data);
  }
}

testConnection();