import supabase from './db';

// Este archivo ya no crea tablas ni tipos, porque Supabase no permite DDL desde el backend.
// La estructura de la base de datos (tablas, tipos, índices) debe crearse desde el panel de Supabase o con migraciones SQL.
// Aquí puedes inicializar datos de ejemplo si lo necesitas.

export const initializeDB = async () => {
  try {
    console.log('🚀 Inicializando datos de ejemplo en Supabase...');
    // Ejemplo: insertar un usuario admin si no existe
    const { data: adminExists } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'admin@mgagro.com');
    if (!adminExists || adminExists.length === 0) {
      await supabase.from('users').insert([
        {
          email: 'admin@mgagro.com',
          password: 'admin123',
          nombre: 'Administrador',
          rol: 'admin',
          activo: true,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        }
      ]);
      console.log('✅ Usuario admin creado');
    } else {
      console.log('ℹ️ El usuario admin ya existe');
    }
    // Puedes agregar más datos de ejemplo aquí si lo necesitas
    console.log('🎉 Inicialización de datos terminada.');
  } catch (error) {
    console.error('❌ Error al inicializar datos en Supabase:', error);
    throw error;
  }
};