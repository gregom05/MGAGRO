-- Agregar columnas de auditoría a la tabla empleados
-- Estas columnas permiten rastrear quién creó y quién actualizó cada registro

-- Agregar columna created_by (referencia al usuario que creó el empleado)
ALTER TABLE empleados 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Agregar columna updated_by (referencia al usuario que actualizó el empleado)
ALTER TABLE empleados 
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Agregar comentarios para documentación
COMMENT ON COLUMN empleados.created_by IS 'ID del usuario que creó este registro';
COMMENT ON COLUMN empleados.updated_by IS 'ID del usuario que actualizó este registro por última vez';

-- Crear índices para mejorar consultas de auditoría
CREATE INDEX IF NOT EXISTS idx_empleados_created_by ON empleados(created_by);
CREATE INDEX IF NOT EXISTS idx_empleados_updated_by ON empleados(updated_by);
