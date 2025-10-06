import { Request, Response } from 'express';
import pool from '../db/db';

// Crear empresa
export const crearEmpresa = async (req: Request, res: Response) => {
  const { nombre_empresa, rut, n_sistema, n_instalacion } = req.body;
  try {
    const queryText = 'INSERT INTO Empresa (nombre_empresa, rut, n_sistema, n_instalacion) VALUES ($1, $2, $3, $4) RETURNING *';
    const queryValues = [nombre_empresa, rut, n_sistema, n_instalacion];
    let debugQuery = queryText;
    queryValues.forEach((val, idx) => {
      debugQuery = debugQuery.replace(`$${idx + 1}`, `'${val}'`);
    });
    console.log('Query real:', debugQuery);
    const result = await pool.query(queryText, queryValues);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear empresa' });
  }
};

// Buscar empresas por rut, nombre, sistema o instalación
export const buscarEmpresas = async (req: Request, res: Response) => {
  const { rut, nombre_empresa, n_sistema, n_instalacion } = req.query;
  try {
    let query = 'SELECT * FROM Empresa WHERE 1=1';
    const params: any[] = [];
    if (rut) {
      query += ' AND rut = $' + (params.length + 1);
      params.push(rut);
    }
    if (nombre_empresa) {
      query += ' AND nombre_empresa ILIKE $' + (params.length + 1);
      params.push(nombre_empresa);
    }
    if (n_sistema) {
      query += ' AND n_sistema = $' + (params.length + 1);
      params.push(n_sistema);
    }
    if (n_instalacion) {
      query += ' AND n_instalacion = $' + (params.length + 1);
      params.push(n_instalacion);
    }
    if (params.length === 0) {
      return res.json([]);
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar empresas' });
  }
};

// Eliminar empresa
export const eliminarEmpresa = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM Empresa WHERE id = $1', [id]);
    res.json({ message: 'Empresa eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar empresa' });
  }
};

// Actualizar empresa por rut y nombre_empresa
export const actualizarEmpresa = async (req: Request, res: Response) => {
  const { rut, nombre_empresa, n_sistema, n_instalacion } = req.body;
  try {
    const queryText = `
      UPDATE Empresa
      SET n_sistema = $1, n_instalacion = $2
      WHERE rut = $3 AND nombre_empresa = $4
      RETURNING *`;
    const queryValues = [n_sistema, n_instalacion, rut, nombre_empresa];
    const result = await pool.query(queryText, queryValues);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Empresa no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar empresa' });
  }
};

