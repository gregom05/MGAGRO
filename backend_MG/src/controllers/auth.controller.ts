import { Request, Response } from 'express';
import pool from '../db/db';
import jwt from 'jsonwebtoken';
// import bcrypt from 'bcrypt'; // Descomentar cuando instales bcrypt

const JWT_SECRET = process.env.JWT_SECRET || 'mg-agro-secret-key-2025';

// Login de usuario
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Buscar usuario y su empleado asociado
    const queryText = `
      SELECT 
        u.id, u.email, u.password, u.nombre, u.rol, u.activo,
        e.id as empleado_id, e.nombre as empleado_nombre, e.apellido as empleado_apellido
      FROM users u
      LEFT JOIN empleados e ON e.user_id = u.id
      WHERE u.email = $1 AND u.activo = true
    `;
    const result = await pool.query(queryText, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales inválidas' 
      });
    }

    const user = result.rows[0];
    
    // Comparar password (si usas bcrypt, descomentar la línea siguiente)
    // const isValidPassword = await bcrypt.compare(password, user.password);
    const isValidPassword = password === user.password; // Temporal (sin encriptar)

    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales inválidas' 
      });
    }

    // Crear token JWT con información del usuario y empleado
    const tokenPayload = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      empleado_id: user.empleado_id || null
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

    // No enviar el password en la respuesta
    const { password: _, ...userWithoutPassword } = user;

    res.json({ 
      success: true,
      message: 'Inicio de sesión exitoso', 
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        empleado_id: user.empleado_id,
        empleado_nombre: user.empleado_id ? `${user.empleado_nombre} ${user.empleado_apellido}` : null
      },
      token
    });
  } catch (error) {
    console.error('Error al realizar el login:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
};

// Registrar nuevo usuario
export const register = async (req: Request, res: Response) => {
  const { email, password, nombre, rol } = req.body;

  try {
    // Validar que el email no exista
    const existingUser = await pool.query('SELECT id FROM Users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Encriptar password (si usas bcrypt, descomentar)
    // const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPassword = password; // Temporal

    const queryText = `
      INSERT INTO Users (email, password, nombre, rol, activo) 
      VALUES ($1, $2, $3, $4, true) 
      RETURNING id, email, nombre, rol, activo, createdat
    `;
    const result = await pool.query(queryText, [email, hashedPassword, nombre, rol || 'empleado']);

    res.status(201).json({ 
      message: 'Usuario registrado exitosamente', 
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener perfil del usuario
export const getProfile = async (req: Request, res: Response) => {
  try {
    // TODO: Obtener user_id del token JWT
    const userId = req.params.id;

    const result = await pool.query(
      'SELECT id, email, nombre, rol, activo, createdat FROM Users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Cambiar contraseña
export const cambiarPassword = async (req: Request, res: Response) => {
  const { userId, passwordActual, passwordNueva } = req.body;

  try {
    // Validaciones
    if (!userId || !passwordActual || !passwordNueva) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (passwordNueva.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    // Obtener usuario actual
    const userResult = await pool.query(
      'SELECT id, password FROM users WHERE id = $1 AND activo = true',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = userResult.rows[0];

    // Verificar contraseña actual (sin bcrypt por ahora)
    // Con bcrypt: const isValidPassword = await bcrypt.compare(passwordActual, user.password);
    const isValidPassword = passwordActual === user.password;

    if (!isValidPassword) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    }

    // Actualizar contraseña (sin encriptar por ahora)
    // Con bcrypt: const hashedPassword = await bcrypt.hash(passwordNueva, 10);
    const hashedPassword = passwordNueva;

    await pool.query(
      'UPDATE users SET password = $1, updatedat = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({ 
      success: true,
      message: 'Contraseña actualizada correctamente' 
    });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
