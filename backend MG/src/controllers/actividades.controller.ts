import { Request, Response } from 'express';
import pool from '../db/db';

// Crear actividad
export const crearActividad = async (req: Request, res: Response) => {
  const { empleado_id, fecha, descripcion, horas, observaciones } = req.body;

  try {
    const queryText = `
      INSERT INTO Actividades (empleado_id, fecha, descripcion, horas, observaciones) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `;
    const result = await pool.query(queryText, [
      empleado_id, fecha, descripcion, horas, observaciones || null
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error al crear actividad:', error);
    if (error.code === '23505') {
      return res.status(400).json({ 
        error: 'Ya existe una actividad con esa descripción para este empleado en esta fecha' 
      });
    }
    res.status(500).json({ error: 'Error al crear actividad' });
  }
};

// Obtener actividades con filtros
export const obtenerActividades = async (req: Request, res: Response) => {
  const { empleado_id, fecha_desde, fecha_hasta } = req.query;

  try {
    let query = `
      SELECT a.*, e.nombre, e.apellido 
      FROM Actividades a
      JOIN Empleados e ON a.empleado_id = e.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (empleado_id) {
      params.push(empleado_id);
      query += ` AND a.empleado_id = $${params.length}`;
    }

    if (fecha_desde) {
      params.push(fecha_desde);
      query += ` AND a.fecha >= $${params.length}`;
    }

    if (fecha_hasta) {
      params.push(fecha_hasta);
      query += ` AND a.fecha <= $${params.length}`;
    }

    query += ' ORDER BY a.fecha DESC, a.createdat DESC';

    const result = await pool.query(query, params);
    res.json({ 
      success: true, 
      actividades: result.rows 
    });
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener actividades' 
    });
  }
};

// Obtener actividades por empleado
export const obtenerActividadesPorEmpleado = async (req: Request, res: Response) => {
  const { empleado_id } = req.params;
  const { fecha_desde, fecha_hasta } = req.query;

  try {
    let query = 'SELECT * FROM Actividades WHERE empleado_id = $1';
    const params: any[] = [empleado_id];

    if (fecha_desde) {
      params.push(fecha_desde);
      query += ` AND fecha >= $${params.length}`;
    }

    if (fecha_hasta) {
      params.push(fecha_hasta);
      query += ` AND fecha <= $${params.length}`;
    }

    query += ' ORDER BY fecha DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    res.status(500).json({ error: 'Error al obtener actividades' });
  }
};

// Obtener actividad por ID
export const obtenerActividadPorId = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT a.*, e.nombre, e.apellido 
       FROM Actividades a
       JOIN Empleados e ON a.empleado_id = e.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener actividad:', error);
    res.status(500).json({ error: 'Error al obtener actividad' });
  }
};

// Actualizar actividad
export const actualizarActividad = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fecha, descripcion, horas, observaciones } = req.body;

  try {
    const queryText = `
      UPDATE Actividades 
      SET fecha = $1, descripcion = $2, horas = $3, 
          observaciones = $4, updatedat = CURRENT_TIMESTAMP
      WHERE id = $5 
      RETURNING *
    `;
    const result = await pool.query(queryText, [
      fecha, descripcion, horas, observaciones, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar actividad:', error);
    res.status(500).json({ error: 'Error al actualizar actividad' });
  }
};

// Eliminar actividad
export const eliminarActividad = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM Actividades WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    res.json({ message: 'Actividad eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar actividad:', error);
    res.status(500).json({ error: 'Error al eliminar actividad' });
  }
};

// Obtener resumen de horas por empleado
export const obtenerResumenHoras = async (req: Request, res: Response) => {
  const { fecha_desde, fecha_hasta } = req.query;

  try {
    let query = `
      SELECT 
        e.id as empleado_id,
        e.nombre,
        e.apellido,
        SUM(a.horas) as total_horas,
        COUNT(a.id) as total_actividades
      FROM Empleados e
      LEFT JOIN Actividades a ON e.id = a.empleado_id
      WHERE e.activo = true
    `;
    const params: any[] = [];

    if (fecha_desde) {
      params.push(fecha_desde);
      query += ` AND a.fecha >= $${params.length}`;
    }

    if (fecha_hasta) {
      params.push(fecha_hasta);
      query += ` AND a.fecha <= $${params.length}`;
    }

    query += ' GROUP BY e.id, e.nombre, e.apellido ORDER BY e.apellido, e.nombre';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener resumen de horas:', error);
    res.status(500).json({ error: 'Error al obtener resumen de horas' });
  }
};
