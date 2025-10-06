import { Request, Response } from 'express';
import pool from '../db/db';

// Crear base de datos vinculada a empresa
export const crearBaseDatos = async (req: Request, res: Response) => {
  const { nombre_bd, empresa_id } = req.body;
  try {
    const queryText =
      'INSERT INTO BaseDatos (nombre_bd, empresa_id) VALUES ($1, $2) RETURNING *';
    const queryValues = [nombre_bd, empresa_id];
    let debugQuery = queryText;
    queryValues.forEach((val, idx) => {
      debugQuery = debugQuery.replace(`$${idx + 1}`, `'${val}'`);
    });
    console.log('Query real:', debugQuery);
    const result = await pool.query(queryText, queryValues);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear base de datos' });
  }
};

// Buscar bases de datos por empresa
export const buscarBasesDatos = async (req: Request, res: Response) => {
  const { empresa_id } = req.query;
  try {
    if (!empresa_id) {
      return res.json([]);
    }
    const result = await pool.query(
      'SELECT * FROM BaseDatos WHERE empresa_id = $1',
      [empresa_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar bases de datos' });
  }
};

// Eliminar base de datos
export const eliminarBaseDatos = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM BaseDatos WHERE id = $1', [id]);
    res.json({ message: 'Base de datos eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar base de datos' });
  }
};

// Actualizar base de datos vinculada a empresa
export const actualizarBaseDatos = async (req: Request, res: Response) => {
  const { nombre_bd, empresa_id } = req.body;
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE BaseDatos SET nombre_bd = $1, empresa_id = $2 WHERE id = $3 RETURNING *',
      [nombre_bd, empresa_id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Base de datos no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar base de datos' });
  }
};
