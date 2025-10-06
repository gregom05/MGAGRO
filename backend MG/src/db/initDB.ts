import pool from './db';

export const initializeDB = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando creación de tablas en Supabase...');

    // Crear ENUM para roles de usuario
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('admin', 'gerente', 'empleado', 'usuario');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ Tipo ENUM "user_role" verificado/creado');

    // Crear tabla Users con rol
    const createUsersTableQuery = `
      CREATE TABLE IF NOT EXISTS Users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        rol user_role NOT NULL DEFAULT 'empleado',
        activo BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createUsersTableQuery);
    console.log('✅ Tabla "Users" verificada/creada');

    // Crear tabla Empleados
    const createEmpleadosTableQuery = `
      CREATE TABLE IF NOT EXISTS Empleados (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES Users(id) ON DELETE SET NULL,
        nombre VARCHAR(255) NOT NULL,
        apellido VARCHAR(255) NOT NULL,
        documento VARCHAR(50) UNIQUE,
        telefono VARCHAR(50),
        email VARCHAR(255),
        direccion TEXT,
        fecha_ingreso DATE NOT NULL,
        puesto VARCHAR(100),
        salario DECIMAL(10, 2),
        activo BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createEmpleadosTableQuery);
    console.log('✅ Tabla "Empleados" verificada/creada');

    // Crear tabla Actividades (registro diario de empleados)
    const createActividadesTableQuery = `
      CREATE TABLE IF NOT EXISTS Actividades (
        id SERIAL PRIMARY KEY,
        empleado_id INTEGER NOT NULL REFERENCES Empleados(id) ON DELETE CASCADE,
        fecha DATE NOT NULL,
        descripcion TEXT NOT NULL,
        horas DECIMAL(5, 2) NOT NULL CHECK (horas > 0 AND horas <= 24),
        observaciones TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT actividad_empleado_fecha_unique UNIQUE (empleado_id, fecha, descripcion)
      );
    `;
    await client.query(createActividadesTableQuery);
    console.log('✅ Tabla "Actividades" verificada/creada');

    // Crear índice para consultas rápidas por fecha
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_actividades_fecha ON Actividades(fecha);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_actividades_empleado ON Actividades(empleado_id);
    `);

    // Crear tabla Articulos (inventario)
    const createArticulosTableQuery = `
      CREATE TABLE IF NOT EXISTS Articulos (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(50) UNIQUE NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        categoria VARCHAR(100),
        unidad_medida VARCHAR(50) DEFAULT 'unidad',
        stock_actual DECIMAL(10, 2) DEFAULT 0 CHECK (stock_actual >= 0),
        stock_minimo DECIMAL(10, 2) DEFAULT 0,
        precio_unitario DECIMAL(10, 2),
        activo BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createArticulosTableQuery);
    console.log('✅ Tabla "Articulos" verificada/creada');

    // Crear ENUM para tipo de movimiento
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE tipo_movimiento AS ENUM ('entrada', 'salida', 'ajuste');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ Tipo ENUM "tipo_movimiento" verificado/creado');

    // Crear tabla MovimientosInventario (historial de movimientos)
    const createMovimientosTableQuery = `
      CREATE TABLE IF NOT EXISTS MovimientosInventario (
        id SERIAL PRIMARY KEY,
        articulo_id INTEGER NOT NULL REFERENCES Articulos(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE SET NULL,
        tipo tipo_movimiento NOT NULL,
        cantidad DECIMAL(10, 2) NOT NULL CHECK (cantidad > 0),
        stock_anterior DECIMAL(10, 2) NOT NULL,
        stock_nuevo DECIMAL(10, 2) NOT NULL,
        motivo TEXT,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createMovimientosTableQuery);
    console.log('✅ Tabla "MovimientosInventario" verificada/creada');

    // Crear índices para consultas rápidas
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_movimientos_articulo ON MovimientosInventario(articulo_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON MovimientosInventario(fecha);
    `);

    console.log('🎉 ¡Todas las tablas han sido creadas exitosamente en Supabase!');
  } catch (error) {
    console.error('❌ Error al inicializar las tablas en Supabase:', error);
    throw error;
  } finally {
    client.release();
  }
};