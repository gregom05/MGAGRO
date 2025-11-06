import { Request, Response } from 'express';
import { supabase } from '../db/db';
import jwt from 'jsonwebtoken';
// import bcrypt from 'bcrypt'; // Descomentar cuando instales bcrypt

const JWT_SECRET = process.env.JWT_SECRET || 'mg-agro-secret-key-2025';

// Login de usuario
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Buscar usuario y su empleado asociado
    const { data, error } = await supabase
      .from('users')
      .select('id, email, password, nombre, rol, activo, empleados(id, nombre, apellido)')
      .eq('email', email)
      .eq('activo', true)
      .single();

    if (error || !data) {
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales inválidas' 
      });
    }

    const user = data;
    // Comparar password (sin encriptar)
    const isValidPassword = password === user.password;
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales inválidas' 
      });
    }

    // Crear token JWT con información del usuario y empleado
    const empleado = Array.isArray(user.empleados) && user.empleados.length > 0 ? user.empleados[0] : null;
    const tokenPayload = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      empleado_id: empleado?.id || null
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

    res.json({ 
      success: true,
      message: 'Inicio de sesión exitoso', 
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        empleado_id: empleado?.id,
        empleado_nombre: empleado ? `${empleado.nombre} ${empleado.apellido}` : null
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
    const { data: existing, error: errorExist } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    if (existing) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Encriptar password (si usas bcrypt, descomentar)
    const hashedPassword = password; // Temporal
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password: hashedPassword, nombre, rol: rol || 'empleado', activo: true }])
      .select('id, email, nombre, rol, activo, createdat');
    if (error || !data || data.length === 0) return res.status(500).json({ message: 'Error interno del servidor' });
    res.status(201).json({ 
      message: 'Usuario registrado exitosamente', 
      user: data[0] 
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
    const { data, error } = await supabase
      .from('users')
      .select('id, email, nombre, rol, activo, createdat')
      .eq('id', userId)
      .single();
    if (error || !data) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(data);
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
    const { data: user, error: errorUser } = await supabase
      .from('users')
      .select('id, password')
      .eq('id', userId)
      .eq('activo', true)
      .single();
    if (errorUser || !user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    // Verificar contraseña actual (sin bcrypt por ahora)
    const isValidPassword = passwordActual === user.password;
    if (!isValidPassword) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    }
    // Actualizar contraseña (sin encriptar por ahora)
    const hashedPassword = passwordNueva;
    const { error: errorUpdate } = await supabase
      .from('users')
      .update({ password: hashedPassword, updatedat: new Date().toISOString() })
      .eq('id', userId);
    if (errorUpdate) {
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.json({ 
      success: true,
      message: 'Contraseña actualizada correctamente' 
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
