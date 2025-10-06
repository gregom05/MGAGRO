-- ============================================
-- 📋 MIGRACIÓN: Sistema de Auditoría y Roles
-- ============================================

-- 1. AGREGAR COLUMNAS DE AUDITORÍA A TODAS LAS TABLAS
-- =====================================================

-- Empleados: Agregar campos de auditoría
ALTER TABLE empleados 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- Actividades: Agregar campos de auditoría
ALTER TABLE actividades 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- Articulos: Agregar campos de auditoría
ALTER TABLE articulos 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- MovimientosInventario: Ya tiene user_id, solo agregamos updated_by
ALTER TABLE movimientosinventario 
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);


-- 2. CREAR RELACIÓN USUARIO-EMPLEADO
-- ===================================

-- Asegurarse de que user_id en empleados exista y tenga índice
ALTER TABLE empleados 
ADD COLUMN IF NOT EXISTS user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_empleados_user_id ON empleados(user_id);


-- 3. MODIFICAR TABLA USERS PARA ROLES
-- ====================================

-- Asegurarse de que la columna rol tenga los valores correctos
DO $$ 
BEGIN
    -- Crear tipo ENUM si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'empleado');
    END IF;
END $$;

-- Si la columna rol no existe, crearla
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS rol user_role DEFAULT 'empleado';

-- Si existe pero es VARCHAR, convertirla
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'rol' 
        AND data_type = 'character varying'
    ) THEN
        ALTER TABLE users ALTER COLUMN rol TYPE user_role USING rol::user_role;
    END IF;
END $$;


-- 4. CREAR FUNCIÓN DE AUDITORÍA AUTOMÁTICA
-- =========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedat = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas
DROP TRIGGER IF EXISTS update_empleados_updatedat ON empleados;
CREATE TRIGGER update_empleados_updatedat BEFORE UPDATE ON empleados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_actividades_updatedat ON actividades;
CREATE TRIGGER update_actividades_updatedat BEFORE UPDATE ON actividades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_articulos_updatedat ON articulos;
CREATE TRIGGER update_articulos_updatedat BEFORE UPDATE ON articulos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updatedat ON users;
CREATE TRIGGER update_users_updatedat BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 5. CREAR USUARIO ADMIN POR DEFECTO (si no existe)
-- ==================================================

INSERT INTO users (email, password, nombre, rol, activo, createdat, updatedat)
VALUES (
    'admin@mgagro.com',
    '$2b$10$7ZqK1qXqyQZ0aXhXZ9X9X.8X9X9X9X9X9X9X9X9X9X9X9X9X9X9Xe', -- password: admin123
    'Administrador',
    'admin',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;


-- 6. ÍNDICES PARA MEJORA DE PERFORMANCE
-- ======================================

CREATE INDEX IF NOT EXISTS idx_empleados_created_by ON empleados(created_by);
CREATE INDEX IF NOT EXISTS idx_empleados_updated_by ON empleados(updated_by);
CREATE INDEX IF NOT EXISTS idx_actividades_created_by ON actividades(created_by);
CREATE INDEX IF NOT EXISTS idx_actividades_updated_by ON actividades(updated_by);
CREATE INDEX IF NOT EXISTS idx_articulos_created_by ON articulos(created_by);
CREATE INDEX IF NOT EXISTS idx_articulos_updated_by ON articulos(updated_by);
CREATE INDEX IF NOT EXISTS idx_movimientos_user_id ON movimientosinventario(user_id);
CREATE INDEX IF NOT EXISTS idx_users_rol ON users(rol);


-- 7. COMENTARIOS EN LAS TABLAS
-- =============================

COMMENT ON COLUMN empleados.user_id IS 'Usuario asociado al empleado (para login)';
COMMENT ON COLUMN empleados.created_by IS 'Usuario que creó el registro';
COMMENT ON COLUMN empleados.updated_by IS 'Usuario que modificó el registro por última vez';
COMMENT ON COLUMN actividades.created_by IS 'Usuario que creó el registro';
COMMENT ON COLUMN actividades.updated_by IS 'Usuario que modificó el registro por última vez';
COMMENT ON COLUMN articulos.created_by IS 'Usuario que creó el registro';
COMMENT ON COLUMN articulos.updated_by IS 'Usuario que modificó el registro por última vez';
COMMENT ON COLUMN movimientosinventario.user_id IS 'Usuario que realizó el movimiento';


-- ✅ MIGRACIÓN COMPLETADA
SELECT 'Migración de auditoría y roles completada exitosamente' AS status;
