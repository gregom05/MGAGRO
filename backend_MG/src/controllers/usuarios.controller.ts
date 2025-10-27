import { Request, Response } from 'express';
import db from '../db/db';

// Obtener todos los usuarios
export const getUsuarios = async (req: Request, res: Response) => {
  try {
  const result = await db.query('SELECT id, email, password, nombre, rol, activo, createdat, updatedat FROM users ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// Crear usuario
export const createUsuario = async (req: Request, res: Response) => {
  try {
    const { email, password, nombre, rol, activo } = req.body;
    const result = await db.query(
      'INSERT INTO users (email, password, nombre, rol, activo) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, nombre, rol, activo, createdat, updatedat',
      [email, password, nombre, rol, activo]
    );
    const usuario = result.rows[0];

    // Si el rol es empleado, crear también el registro en empleados
    if (rol === 'empleado') {
      await db.query(
        'INSERT INTO empleados (user_id, nombre, apellido, email, activo, fecha_ingreso) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)',
        [usuario.id, nombre, 'Empleado', email, true]
      );
    }

    res.status(201).json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

// Actualizar usuario
export const updateUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, password, nombre, rol, activo } = req.body;
    const result = await db.query(
      'UPDATE users SET email=$1, password=COALESCE($2, password), nombre=$3, rol=$4, activo=$5, updatedat=NOW() WHERE id=$6 RETURNING id, email, nombre, rol, activo, createdat, updatedat',
      [email, password, nombre, rol, activo, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

// Eliminar usuario
export const deleteUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM users WHERE id=$1', [id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};
