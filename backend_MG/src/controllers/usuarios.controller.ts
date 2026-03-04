import { Request, Response } from 'express';
import { supabase } from '../db/db';

// Obtener todos los usuarios
export const getUsuarios = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, password, nombre, rol, activo, createdat, updatedat')
      .order('id', { ascending: true });
    if (error) return res.status(500).json({ error: 'Error al obtener usuarios' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// Crear usuario
export const createUsuario = async (req: Request, res: Response) => {
  try {
    const { email, password, nombre, rol, activo } = req.body;

    // Validar rol permitido
    const rolesValidos = ['admin', 'empleado', 'general'];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({ error: `Rol inválido. Los roles permitidos son: ${rolesValidos.join(', ')}` });
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password, nombre, rol, activo, createdat: new Date().toISOString(), updatedat: new Date().toISOString() }])
      .select('id, email, nombre, rol, activo, createdat, updatedat');
    if (error) return res.status(500).json({ error: error.message || 'Error al crear usuario' });
    if (!data || data.length === 0) return res.status(500).json({ error: 'Error al crear usuario' });
    const usuario = data[0];

    // Si el rol es empleado, crear también el registro en empleados
    if (rol === 'empleado') {
      await supabase
        .from('empleados')
        .insert([{ user_id: usuario.id, nombre, apellido: 'Empleado', email, activo: true, fecha_ingreso: new Date().toISOString().slice(0, 10) }]);
    }

    res.status(201).json(usuario);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al crear usuario' });
  }
};

// Actualizar usuario
export const updateUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, password, nombre, rol, activo } = req.body;

    // Validar rol permitido
    const rolesValidos = ['admin', 'empleado', 'general'];
    if (rol && !rolesValidos.includes(rol)) {
      return res.status(400).json({ error: `Rol inválido. Los roles permitidos son: ${rolesValidos.join(', ')}` });
    }

    const updateData: any = { email, nombre, rol, activo, updatedat: new Date().toISOString() };
    if (password) updateData.password = password;
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, email, nombre, rol, activo, createdat, updatedat');
    if (error) return res.status(500).json({ error: error.message || 'Error al actualizar usuario' });
    if (!data || data.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(data[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al actualizar usuario' });
  }
};

// Eliminar usuario
export const deleteUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    if (error) return res.status(500).json({ error: 'Error al eliminar usuario' });
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};
