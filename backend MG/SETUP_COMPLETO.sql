-- ============================================
-- 🚀 SETUP COMPLETO - MG AGRO
-- ============================================
-- Este script crea las tablas necesarias y el usuario admin

-- 1. CREAR TABLA USERS SI NO EXISTE
-- ===================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'empleado',
    activo BOOLEAN DEFAULT true,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ELIMINAR USUARIO ADMIN ANTERIOR SI EXISTE
-- =============================================
DELETE FROM users WHERE email = 'admin';

-- 3. CREAR USUARIO ADMIN
-- =======================
INSERT INTO users (email, password, nombre, rol, activo, createdat, updatedat)
VALUES (
    'admin',              -- Email/Usuario
    'mg1234',            -- Contraseña
    'Administrador',     -- Nombre
    'admin',             -- Rol
    true,                -- Activo
    CURRENT_TIMESTAMP,   -- Fecha creación
    CURRENT_TIMESTAMP    -- Fecha actualización
);

-- 4. VERIFICAR QUE SE CREÓ CORRECTAMENTE
-- =======================================
SELECT 
    id,
    email as usuario,
    nombre,
    rol,
    activo,
    createdat as fecha_creacion
FROM users 
WHERE email = 'admin';

-- ============================================
-- ✅ RESULTADO ESPERADO:
-- ============================================
-- id | usuario | nombre        | rol   | activo | fecha_creacion
-- ---|---------|---------------|-------|--------|---------------
-- 1  | admin   | Administrador | admin | true   | 2025-10-05...

-- ============================================
-- 🔐 CREDENCIALES PARA LOGIN:
-- ============================================
-- Usuario: admin
-- Contraseña: mg1234
-- ============================================
